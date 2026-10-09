import { startReconciliationJob } from './jobs/reconciliation.job.js';

const server = app.listen(port, () => {
  console.log(`Metering API listening on port ${port}`);
  startReconciliationJob();
});