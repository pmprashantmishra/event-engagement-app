trigger SessionBoothTrigger on Session_Booth__c(before insert) {
    SessionBoothTriggerHandler.generateRandomUniqueCode(Trigger.new);
}
