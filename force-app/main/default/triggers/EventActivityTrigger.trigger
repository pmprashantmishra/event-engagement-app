trigger EventActivityTrigger on Event_Activity__c(after insert) {
    Set<Id> attendeeIds = new Set<Id>();
    for (Event_Activity__c ea : Trigger.new) {
        attendeeIds.add(ea.Event_Attendee__c);
    }
    EventAppCtrl.syncMetrics(attendeeIds);
}
