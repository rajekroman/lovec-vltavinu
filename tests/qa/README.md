# QA infrastructure

The A6 QA branch prepares the reusable certification matrix before the final release-candidate head exists.

Current runs validate infrastructure only. They are not certification evidence until A0 records the final head SHA. After that confirmation, the first full matrix run is a non-counting warm-up; certification requires two later consecutive green runs on the unchanged confirmed SHA.
