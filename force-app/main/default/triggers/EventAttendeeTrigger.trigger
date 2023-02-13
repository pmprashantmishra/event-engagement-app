trigger EventAttendeeTrigger on Event_Attendees__c(before insert) {
    EventAttendeeTriggerHandler.generateRandomUniqueCode(Trigger.new);
}
