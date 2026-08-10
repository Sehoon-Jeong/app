#!/usr/bin/env python3

import json
import sqlite3
import sys
import tempfile
import unittest
from concurrent.futures import Future
from datetime import datetime, timezone
from pathlib import Path
from unittest import mock


SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

import catalog_guides as guides  # noqa: E402


class CatalogGuideTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules = guides.load_rules(SCRIPT_DIR / "catalog-guide-rules.json")
        cls.family_by_category, duplicates = guides.family_index(cls.rules)
        if duplicates:
            raise AssertionError(f"duplicate rule categories: {duplicates}")

    def product(self, product_id, category):
        return guides.Product(product_id, "테스트 브랜드", f"테스트 제품 {product_id}", category, "젤")

    def test_rules_cover_exactly_46_categories_without_other(self):
        self.assertEqual(46, len(self.family_by_category))
        self.assertNotIn("OTHER", self.family_by_category)
        self.assertNotIn("기타", self.family_by_category)

    def test_live_database_categories_are_mapped_46_of_46(self):
        db_path = ROOT / "backend/data/skn.db"
        if not db_path.exists():
            self.skipTest("local catalog DB is not present")
        products = guides.load_products(db_path)
        report = guides.validate_category_mapping(products, self.rules)
        self.assertTrue(report["mappingComplete"])
        self.assertEqual(46, report["databaseCategoryCount"])
        self.assertEqual(46, report["mappedCategoryCount"])

    def test_editorial_contract_validates_for_every_live_product(self):
        db_path = ROOT / "backend/data/skn.db"
        if db_path.exists():
            products = guides.load_products(db_path)
        else:
            products = [
                self.product(index, category)
                for index, category in enumerate(sorted(self.family_by_category), start=1)
            ]
        generated_at = "2026-08-11T00:00:00Z"
        for product in products:
            family = guides.rule_for(product, self.rules)
            guide = guides.editorial_guide(product, family, self.rules, generated_at)
            self.assertEqual(generated_at, guide["generatedAt"])
            self.assertEqual("EDITORIAL", guide["origin"])
            self.assertEqual(guides.GUIDE_KEYS, set(guide))
            self.assertIn(product.name, guide["summary"])
            self.assertIn(product.category, guide["summary"].replace(product.name, "", 1))
            self.assertIn(product.texture, guide["summary"].replace(product.name, "", 1))
            self.assertTrue(any(item["title"] == "제형" for item in guide["highlights"]))
            visible = json.dumps(guide, ensure_ascii=False)
            for pattern in guides.FORBIDDEN_GUIDE_LANGUAGE_PATTERNS:
                self.assertNotRegex(visible, pattern)

    def test_ai_summary_with_unverified_claim_is_rejected(self):
        product = self.product(1, "세럼")
        family = guides.rule_for(product, self.rules)
        guide = guides.editorial_guide(product, family, self.rules, "2026-08-11T00:00:00Z")
        guide["origin"] = "AI_GENERATED"
        guide["summary"] = "테스트 제품 1: 젤 제형의 세럼으로, 피부 장벽 개선 효과가 있는 안전한 제품이에요."
        with self.assertRaises(guides.GuideValidationError):
            guides.validate_guide(guide, product, family, self.rules)

    def test_summary_requires_texture_and_rejects_old_recording_language(self):
        product = self.product(1, "세럼")
        family = guides.rule_for(product, self.rules)
        guide = guides.editorial_guide(product, family, self.rules, "2026-08-11T00:00:00Z")
        guide["origin"] = "AI_GENERATED"
        guide["summary"] = "테스트 제품 1: 세럼으로, 토너 다음 단계에서 바르는 제품이에요."
        with self.assertRaises(guides.GuideValidationError):
            guides.validate_guide(guide, product, family, self.rules)

        guide["summary"] = "테스트 제품 1: 젤 제형의 세럼으로, 사용 느낌을 기록하는 제품이에요."
        with self.assertRaises(guides.GuideValidationError):
            guides.validate_guide(guide, product, family, self.rules)

    def test_identity_word_does_not_trigger_forbidden_claim_validator(self):
        product = guides.Product(1, "안전브랜드", "장벽 세럼", "세럼", "젤")
        family = guides.rule_for(product, self.rules)
        guide = guides.editorial_guide(product, family, self.rules, "2026-08-11T00:00:00Z")
        guide["origin"] = "AI_GENERATED"
        guides.validate_guide(guide, product, family, self.rules)

    def test_generate_retries_editorial_cache_but_reuses_ai_cache(self):
        product = self.product(1, "세럼")
        family = guides.rule_for(product, self.rules)
        generated_at = "2026-08-11T00:00:00Z"
        model = "test-model"
        input_hash = guides.guide_input_hash(product, family, self.rules, model)
        editorial = guides.ResolvedGuide(
            product,
            input_hash,
            guides.editorial_guide(product, family, self.rules, generated_at),
            "EDITORIAL",
        )
        ai_guide = dict(editorial.guide)
        ai_guide["origin"] = "AI_GENERATED"
        ai_guide["summary"] = "테스트 제품 1: 젤 제형의 세럼으로, 토너 다음 단계에서 바르고 흡수시키는 제품이에요."
        ai = guides.ResolvedGuide(product, input_hash, ai_guide, "AI", 1)
        diagnostics = {"missing": [], "duplicates": [], "extras": [], "invalid": []}

        with tempfile.TemporaryDirectory() as temp_dir:
            artifacts = Path(temp_dir)
            guides.write_artifact(artifacts, editorial, self.rules, model)
            with mock.patch.object(
                guides, "generate_batch", return_value=([ai], diagnostics)
            ) as generate_batch:
                resolved = guides.generate_guides(
                    [product], self.rules, artifacts, "generate", model, "test-key", 10, 1, 0, False
                )
            generate_batch.assert_called_once()
            self.assertEqual("AI_GENERATED", resolved[0].guide["origin"])

            with mock.patch.object(guides, "generate_batch") as generate_batch:
                resolved = guides.generate_guides(
                    [product], self.rules, artifacts, "generate", model, "test-key", 10, 1, 0, False
                )
            generate_batch.assert_not_called()
            self.assertEqual("AI_GENERATED", resolved[0].guide["origin"])
            self.assertEqual("CACHED", resolved[0].source)

    def test_retry_after_header_and_429_fallback_schedule(self):
        self.assertEqual(17.0, guides.retry_after_seconds({"Retry-After": "17"}, 0))
        reference = datetime(2015, 10, 21, 7, 27, 30, tzinfo=timezone.utc)
        self.assertEqual(
            30.0,
            guides.retry_after_seconds(
                {"Retry-After": "Wed, 21 Oct 2015 07:28:00 GMT"}, 0, now=reference
            ),
        )
        self.assertEqual(15.0, guides.retry_after_seconds({}, 0))
        self.assertEqual(30.0, guides.retry_after_seconds({}, 1))
        self.assertEqual(60.0, guides.retry_after_seconds({}, 2))
        self.assertEqual(60.0, guides.retry_after_seconds({"Retry-After": "invalid"}, 8))

    def test_cancel_pending_futures_cancels_only_not_started_work(self):
        running = Future()
        self.assertTrue(running.set_running_or_notify_cancel())
        pending = Future()
        cancelled = guides.cancel_pending_futures([running, pending])
        self.assertEqual(1, cancelled)
        self.assertFalse(running.cancelled())
        self.assertTrue(pending.cancelled())

    def test_missing_duplicate_extra_and_invalid_ids_fall_back_without_gap(self):
        categories = ["세럼", "크림", "선크림", "토너"]
        products = [self.product(index, category) for index, category in enumerate(categories, 1)]
        generated_at = "2026-08-11T00:00:00Z"

        first_family = guides.rule_for(products[0], self.rules)
        first = guides.editorial_guide(products[0], first_family, self.rules, generated_at)
        first["origin"] = "AI_GENERATED"
        first["summary"] = "테스트 제품 1: 젤 제형의 세럼으로, 토너 다음 단계에서 바르고 흡수시키는 제품이에요."

        second_family = guides.rule_for(products[1], self.rules)
        second = guides.editorial_guide(products[1], second_family, self.rules, generated_at)
        second["origin"] = "AI_GENERATED"

        fourth_family = guides.rule_for(products[3], self.rules)
        fourth = guides.editorial_guide(products[3], fourth_family, self.rules, generated_at)
        fourth["origin"] = "AI_GENERATED"
        fourth["usageTiming"] = ["존재하지 않는 시간"]

        payload = {
            "items": [
                {"productId": 1, "guide": first},
                {"productId": 2, "guide": second},
                {"productId": 2, "guide": second},
                {"productId": 4, "guide": fourth},
                {"productId": 999, "guide": first},
            ]
        }
        resolved, diagnostics = guides.resolve_batch_items(
            products, payload, self.rules, generated_at, "test-model", 1
        )
        guides.ensure_selected_coverage(products, resolved, self.rules)
        self.assertEqual([3], diagnostics["missing"])
        self.assertEqual([2], diagnostics["duplicates"])
        self.assertEqual([999], diagnostics["extras"])
        self.assertEqual([4], diagnostics["invalid"])
        self.assertEqual(["AI", "EDITORIAL", "EDITORIAL", "EDITORIAL"], [item.source for item in resolved])

    def test_upsert_writes_exact_table_contract(self):
        product = self.product(7, "토너")
        family = guides.rule_for(product, self.rules)
        guide = guides.editorial_guide(product, family, self.rules, "2026-08-11T00:00:00Z")
        resolved = [guides.ResolvedGuide(product, "hash", guide, "EDITORIAL")]
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "test.db"
            connection = sqlite3.connect(db_path)
            connection.executescript(
                """
                PRAGMA foreign_keys = ON;
                CREATE TABLE product(id INTEGER PRIMARY KEY);
                INSERT INTO product(id) VALUES (7);
                CREATE TABLE product_catalog_content(
                  product_id INTEGER PRIMARY KEY,
                  summary TEXT NOT NULL,
                  routine_step TEXT NOT NULL,
                  usage_type TEXT NOT NULL,
                  usage_timing_json TEXT NOT NULL,
                  usage_tips_json TEXT NOT NULL,
                  observation_points_json TEXT NOT NULL,
                  origin TEXT NOT NULL CHECK(origin IN ('AI_GENERATED','EDITORIAL')),
                  generated_at TEXT NOT NULL,
                  FOREIGN KEY(product_id) REFERENCES product(id)
                );
                """
            )
            connection.close()
            guides.upsert_guides(db_path, resolved, "product_catalog_content")
            connection = sqlite3.connect(db_path)
            row = connection.execute(
                "SELECT product_id, origin, usage_timing_json FROM product_catalog_content"
            ).fetchone()
            connection.close()
            self.assertEqual(7, row[0])
            self.assertEqual("EDITORIAL", row[1])
            self.assertEqual(guide["usageTiming"], json.loads(row[2]))


if __name__ == "__main__":
    unittest.main()
