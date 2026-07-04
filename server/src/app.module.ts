import { Module } from '@nestjs/common';
import { QuestionsModule } from './questions/questions.module';
import { UserPresenceModule } from './userPresence/userPresence.module';

// This app is scoped to the questions microservice: Questions + presence
// only. Friends and Messages were pulled out — they'll come back as their
// own separate services (a friends service, plus a separate auth service),
// not as modules in here.
@Module({
  imports: [QuestionsModule, UserPresenceModule],
})
export class AppModule {}
