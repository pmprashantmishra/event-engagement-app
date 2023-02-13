trigger SessionBoothAttendanceTrigger on Session_Booth_Attendance__c(
    after insert
) {
    Set<Id> attendeeIds = new Set<Id>();
    for (Session_Booth_Attendance__c ea : Trigger.new) {
        attendeeIds.add(ea.Event_Attendee__c);
    }
    EventAppCtrl.syncMetrics(attendeeIds);
}
