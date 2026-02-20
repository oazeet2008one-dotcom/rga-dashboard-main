/**
 * =============================================================================
 * RunLogger Facade
 * =============================================================================
 * Co-ordinates UI and Ops logging for a single execution run.
 * =============================================================================
 */

import { IRunLogger, IUiPrinter, IOpsLogger } from './contracts';

export class RunLogger implements IRunLogger {
    constructor(
        public readonly printer: IUiPrinter,
        public readonly ops: IOpsLogger
    ) { }
}
