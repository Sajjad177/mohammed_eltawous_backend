import paymentService from '../entities/subscription/payment.service.js';

let cronJob = null;

export const startPaymentCronJob = (checkIntervalMs = 10000) => {
  // Schedule: every N milliseconds (default 10 seconds)
  // checkIntervalMs should be in milliseconds
  
  cronJob = setInterval(async () => {
    try {
      console.log(`⏰ [CRON] Payment verification job started (every ${checkIntervalMs / 1000}s)`);
      const result = await paymentService.verifyPendingPayments();
      console.log('✅ [CRON] Payment verification completed:', result);
    } catch (error) {
      console.error('❌ [CRON] Payment verification failed:', error.message);
    }
  }, checkIntervalMs);

  console.log(`✅ Payment verification cron job scheduled (every ${checkIntervalMs / 1000} seconds)`);
  return cronJob;
};

export const stopPaymentCronJob = () => {
  if (cronJob) {
    clearInterval(cronJob);
    console.log('⏹️ Payment cron job stopped');
  }
};

export default { startPaymentCronJob, stopPaymentCronJob };
