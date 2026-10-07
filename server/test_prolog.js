import pl from 'tau-prolog';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const session = pl.create(5000);
const plFilePath = path.join(__dirname, '..', 'logic', 'fairqueue.pl');
const plCode = fs.readFileSync(plFilePath, 'utf8');

session.consult(plCode, {
  success: function() {
    console.log("1. Base rules consulted successfully.");

    const facts = `
      person(p1, 'Anjana', 45, high, scheduled, disability, '09:00').
      person(p2, 'Avanish', 15, medium, walkin, none, '09:30').
      person(p3, 'Carlos', 10, high, walkin, emergency, '09:35').
      person(p4, 'Beatrice', 65, low, scheduled, elderly, '08:40').
      person(p5, 'Dev', 15, medium, scheduled, none, '09:30').
      person(p6, 'Fatima', 10, low, walkin, none, '09:40').
    `;

    session.consult(facts, {
      success: function() {
        console.log("2. Sample facts consulted successfully.");

        session.query("rank_all_people(RankedList).", {
          success: function() {
            session.answer(function(answer) {
              if (answer === false) {
                console.log("Query failed: no solution.");
                return;
              }
              if (pl.type.is_error(answer)) {
                console.error("Query returned Prolog error:", session.format_answer(answer));
                return;
              }
              console.log("3. SUCCESS: Evaluated & Ranked Queue!");
              console.log("Formatted Prolog Answer:\n", session.format_answer(answer));

              // Check pairwise comparison
              session.query("compare_pair(p1, p2, Winner, Loser, Reason).", {
                success: function() {
                  session.answer(function(pairAns) {
                    console.log("\n4. Pairwise Comparison (p1 vs p2):", session.format_answer(pairAns));
                  });
                }
              });
            });
          },
          error: function(err) {
            console.error("Query syntax error:", err);
          }
        });
      },
      error: function(err) {
        console.error("Facts syntax error:", err);
      }
    });
  },
  error: function(err) {
    console.error("Consult error:", err);
  }
});
