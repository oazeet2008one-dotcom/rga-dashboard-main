import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { MailService } from './services/mail.service';

@Global()
@Module({
    providers: [EncryptionService, MailService],
    exports: [EncryptionService, MailService],
})
export class CommonModule { }
