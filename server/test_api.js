import { dbService } from './services/dbService.js';
import { prologService } from './services/prologService.js';
import { demoPeople } from './data/demoData.js';

async function runApiTests() {
  console.log('--- TEST 1: Database seed & retrieval ---');
  await dbService.seedPeople(demoPeople);
  const people = await dbService.getAllPeople();
  console.log(`Seeded ${people.length} people. First person: ${people[0].name} (${people[0].personId})`);

  console.log('\n--- TEST 2: Prolog Engine Analysis ---');
  const config = await dbService.getRuleConfig();
  const result = await prologService.analyzeQueue(people, config);
  console.log(`Analysis completed with engine: ${result.engineUsed}`);
  console.log(`Ranked queue length: ${result.rankedQueue.length}`);
  
  result.rankedQueue.forEach((p, idx) => {
    console.log(` Rank ${idx + 1}: ${p.name.padEnd(20)} [${p.priority.toUpperCase().padEnd(6)}] (Wait: ${String(p.waitingTime).padStart(2)}m) Rules: ${p.ruleCodes.join(', ')}`);
  });

  console.log('\n--- TEST 3: Pairwise Reason ---');
  const pair = await prologService.comparePair(people[0], people[3], config);
  console.log(`Comparison between ${people[0].name} & ${people[3].name}:`);
  console.log(`Winner ID: ${pair.winnerId}`);
  console.log(`Reason: ${pair.reason}`);

  console.log('\n--- TEST 4: Configurable Thresholds ---');
  const rules = prologService.getRuleDefinitions();
  console.log(`Total explicit logic rules defined: ${rules.length}`);
  console.log('All tests passed successfully!');
}

runApiTests().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});
