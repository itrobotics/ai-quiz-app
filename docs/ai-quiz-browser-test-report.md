# AI Quiz App Browser Test Report

Test target: http://localhost:5173/ai-quiz-app/

Test case source: D:\內部教育訓練\AI自動化教學\ai-quiz-app-clone\docs\test-case.md

Run time: 2026-06-05 00:37-00:43 Asia/Taipei

## Summary

Conclusion: 有條件上線

The browser-tested core flow passed: environment smoke check, teacher creates and activates a question, student answers it, duplicate submission is blocked on refresh, teacher statistics update, question can be closed, and student page returns to the waiting state.

Items not fully tested in this pass: Google Sheets manual header inspection, incognito access, multi-user concurrency, network outage recovery, and cross-browser coverage.

## Test Data

- Created question: `Codex browser 測試題 2026-06-04T16-39-52-483Z：下列哪個選項是正確答案？`
- Backend id: `q-68ad0631-4146`
- Final backend status: `closed`
- Submitted answer: `A`

## Results

| Case | Result | Notes |
|---|---|---|
| ENV-01 | PASS | `.env` has no UTF-16 BOM and `VITE_GAS_URL` ends with `/exec`. |
| ENV-02 | PASS | `?action=getActiveQuestion` returned JSON from GAS. |
| ENV-06 | PASS | Frontend loaded and displayed active question/waiting states without blank screen. |
| TC-S01 | PASS | Student page displayed question plus four A/B/C/D options within the load window. |
| TC-S02 | PASS | After closing all active questions, student page displayed no-open-question waiting state. |
| TC-S03 | PASS | Selecting option A enabled submit; submit showed `已送出，感謝作答！`. |
| TC-S04 | PASS by stats evidence | Teacher stats changed to total 1, A = 1 after submission. Direct Sheets row inspection was not performed. |
| TC-S05 | PASS | Reload after answering showed `您已作答過此題`; no submit action remained available. |
| TC-T01 | PASS | New question appeared in teacher list with `草稿` status. |
| TC-T02 | PASS | Clicking `開放此題` changed the test question to `開放中`; button changed to `關閉題目`. |
| TC-T04 | PASS | Opening the test question automatically changed the prior active question to `已關閉`. |
| TC-T05 | PASS | Clicking `關閉題目` changed the active test question to `已關閉`. |
| TC-T08 | PASS | Stats panel showed total, option vote counts, percentages, bar chart, and correct answer marker. |
| TC-T09 | PASS | Before student answer, stats panel showed total 0 and `尚無學員作答`. |
| TC-B01 | PASS | Empty add form showed validation message `請填寫題目`. |
| TC-X01 / AC-008 | PARTIAL PASS | Mobile student waiting page rendered correctly at 390x844. Full mobile answer flow was not rerun because no active question remained after cleanup. |
| TC-X02 / AC-008 | FAIL | Mobile teacher page did not stack into a single column at 390x844; the stats column became very narrow with vertical-looking wrapped text. |
| TC-X03 / AC-009 | FAIL | GAS GET timings measured from PowerShell were `getActiveQuestion` 2249 ms and `getAllQuestions` 2854 ms, exceeding the < 2 sec target. |
| FR-009 | FAIL / Not Implemented | `src` and `gas` search found no CSV export UI/API implementation. |

## Observations

- Teacher page load was slow enough to show the loading state for several seconds, but eventually rendered correctly.
- Console showed only React Router future flag warnings; no runtime errors were observed.
- TC-T07 expects a blocking prompt for editing an active question, but the current UI disables `編輯` and `刪除` buttons for active questions instead.
- `docs/spec.md` includes FR-009 export CSV, but the test-case table does not include a direct FR-009 case and the implementation appears absent.
- Mobile teacher layout needs attention before relying on the app from a phone-sized viewport.

## Screenshots

- `ai-quiz-teacher-after-tests.png`
- `ai-quiz-final-student-waiting.png`
- `ai-quiz-mobile-student.png`
- `ai-quiz-mobile-teacher.png`
