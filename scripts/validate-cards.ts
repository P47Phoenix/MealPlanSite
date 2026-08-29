import { MEAL_CARDS } from '../src/data/cards';
import { validateDataset } from '../src/lib/dietaryRules';
import { TAG_GROUPS, TAG_REGISTRY, TAGS_IN_GROUP_ORDER } from '../src/data/tags';

function main(): void {
  const violations = validateDataset(MEAL_CARDS);

  if (violations.length > 0) {
    console.error(`\nFound ${violations.length} violation(s):\n`);
    for (const v of violations) {
      console.error(`  [${v.rule}] (${v.cardId}) ${v.message}`);
    }
    console.error('\nValidation FAILED.\n');
    process.exit(1);
  }

  const tagCounts = new Map<string, number>();
  const mealTypeCounts = new Map<string, number>();
  for (const card of MEAL_CARDS) {
    mealTypeCounts.set(card.mealType, (mealTypeCounts.get(card.mealType) ?? 0) + 1);
    for (const tag of card.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  console.log(`Validated ${MEAL_CARDS.length} meal cards — no hard-fail violations.\n`);
  console.log('By meal type:');
  for (const [type, count] of [...mealTypeCounts.entries()].sort()) {
    console.log(`  ${type}: ${count}`);
  }
  console.log('\nBy tag:');
  for (const group of TAG_GROUPS) {
    console.log(`  ${group.label}:`);
    for (const tag of TAGS_IN_GROUP_ORDER[group.id]) {
      console.log(`    ${TAG_REGISTRY[tag].label} (${tag}): ${tagCounts.get(tag) ?? 0}`);
    }
  }
  console.log('\nValidation PASSED.\n');
  process.exit(0);
}

main();
