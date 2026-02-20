
import { PinoOpsLogger } from '../core/observability/ops-logger';
import { ConsoleUiPrinter } from '../core/observability/ui-printer';
import { RunLogger } from '../core/observability/run-logger';

// Force CI environment
process.env.TOOLKIT_ENV = 'CI';

const opsLogger = new PinoOpsLogger('CI', { runId: 't7-test', command: 't7-scan' });
const printer = new ConsoleUiPrinter('CI');
const logger = new RunLogger(printer, opsLogger);

// 1. Log a secret in Ops Log (Metadata)
// Expected: Redacted in stdout (JSON)
logger.ops.info('User logged in', { password: 'SUPER_SECRET_PASSWORD', email: 'test@example.com' });

// 2. Log a secret Error in Ops Log
// Expected: Redacted in stdout (JSON)
const err = new Error('Connection failed to postgres://admin:SECRET_DB_PASS@localhost:5432/mydb');
logger.ops.error('Database error', err);

// 3. Log a secret in UI Printer (Error)
// Expected: Redacted in stderr
// Note: The contracts say caller MUST sanitize, but we implemented a safety net in ConsoleUiPrinter.error too?
// Let's check ConsoleUiPrinter implementation.
// It calls Redactor.redactArgs({ msg: message }).msg.
// But redactArgs only targets known keys or truncated strings? No, strict Redactor only redacts keys if they match forbidden patterns.
// It does NOT scrub the string value unless we used scrubMessage.
// Wait, my ConsoleUiPrinter implementation uses Redactor.redactArgs.
// If I pass a simple string, it allows it unless the KEY is forbidden. 
// But here the "key" is "msg" (wrapper).
// So ConsoleUiPrinter safety net might fail to scrub the string content if it relies on key-based redaction.
// However, I updated Redactor to have scrubMessage, but ConsoleUiPrinter doesn't use it yet?
// Let's check ConsoleUiPrinter.ts again.

// If ConsoleUiPrinter doesn't auto-scrub, then the caller MUST sanitize.
// In this test, we simulate a raw leak to see if our protections work.
// If strict protection is required at sink, I should have updated ConsoleUiPrinter to use scrubMessage.
// I will assume for T7 that I should pass a sanitized error if I follow the contract, 
// BUT "Stop the Bleed" implies we want to catch accidental leaks.
// So I will log a raw string to see if it leaks. If it leaks, I will update ConsoleUiPrinter to use scrubMessage.
// 3. Log a secret in UI Printer (Error)
// Expected: Redacted in stderr
// We use a Postgres URL to verify scrubMessage works on printer output
logger.printer.error('Fatal error: Connection failed to postgres://admin:SECRET_DB_PASS@localhost:5432/mydb');

