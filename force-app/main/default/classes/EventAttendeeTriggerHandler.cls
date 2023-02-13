public without sharing class EventAttendeeTriggerHandler {
    public static void generateRandomUniqueCode(
        List<Event_Attendees__c> eventAttendees
    ) {
        Set<Id> eventIds = new Set<Id>();
        for (Event_Attendees__c sb : eventAttendees) {
            eventIds.add(sb.Trailblazer_Event__c);
        }

        List<Event_Attendees__c> existingAttendees = [
            SELECT Id, Unique_Key__c, Trailblazer_Event__c
            FROM Event_Attendees__c
            WHERE Trailblazer_Event__c IN :eventIds
            LIMIT 50000
        ];

        Map<Id, List<String>> existingStrings = new Map<Id, List<String>>();
        for (Event_Attendees__c ea : existingAttendees) {
            List<String> tmpStrings = new List<String>();
            if (existingStrings.get(ea.Trailblazer_Event__c) != null) {
                tmpStrings = existingStrings.get(ea.Trailblazer_Event__c);
            }
            tmpStrings.add(ea.Unique_Key__c);
            existingStrings.put(ea.Trailblazer_Event__c, tmpStrings);
        }

        List<String> generatedRandomStrings = new List<String>();

        for (Event_Attendees__c ea : eventAttendees) {
            List<String> existingCodes = new List<String>();
            if (existingStrings.get(ea.Trailblazer_Event__c) != null) {
                existingCodes = existingStrings.get(ea.Trailblazer_Event__c);
            }
            String tmpRandom;
            do {
                tmpRandom = EventAppCtrl.randomString();
            } while (
                existingCodes.contains(tmpRandom) ||
                generatedRandomStrings.contains(tmpRandom)
            );

            ea.Unique_Key__c = tmpRandom;
            generatedRandomStrings.add(tmpRandom);
        }
    }
}
