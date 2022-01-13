# Everything that needs doing

## feature/compare-versions
 
 - BRANCH: make a A downloadController - scanning/watching/checking the downloads folder: 
  - File ages - determine if download is recent
  - File Presence - determine if zip/data exist.
 - BRANCH: Integration test for CompareVersion
  - unable to unit test due to fs issues
 - BRANCH: Unit test UnzipJson
 - BRANCH: Unit test StallGuard/separate into new package
 - BRANCH: Update Unzip to take an argument that determines if it should close early 
   - Return promises for any unfinished streams
   - Parameterise meta and data parts
   - Split out the splitting out of JSON (for future use?)
 - BRANCH: Investigate promisifying all functions (streams/promises and util.promisify)