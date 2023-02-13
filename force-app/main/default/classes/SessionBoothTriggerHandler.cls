public without sharing class SessionBoothTriggerHandler {
    public static void generateRandomUniqueCode(
        List<Session_Booth__c> sessionBooths
    ) {
        Set<Id> eventIds = new Set<Id>();
        for (Session_Booth__c sb : sessionBooths) {
            eventIds.add(sb.Trailblazer_Event__c);
        }

        List<Session_Booth__c> existingBooths = [
            SELECT Id, Code__c, Trailblazer_Event__c
            FROM Session_Booth__c
            WHERE Trailblazer_Event__c IN :eventIds
            LIMIT 50000
        ];

        Map<Id, List<String>> existingStrings = new Map<Id, List<String>>();
        for (Session_Booth__c sb : existingBooths) {
            List<String> tmpStrings = new List<String>();
            if (existingStrings.get(sb.Trailblazer_Event__c) != null) {
                tmpStrings = existingStrings.get(sb.Trailblazer_Event__c);
            }
            tmpStrings.add(sb.Code__c);
            existingStrings.put(sb.Trailblazer_Event__c, tmpStrings);
        }

        List<String> generatedRandomStrings = new List<String>();

        for (Session_Booth__c sb : sessionBooths) {
            List<String> existingCodes = new List<String>();
            if (existingStrings.get(sb.Trailblazer_Event__c) != null) {
                existingCodes = existingStrings.get(sb.Trailblazer_Event__c);
            }
            String tmpRandom;
            do {
                tmpRandom = EventAppCtrl.randomString();
            } while (
                existingCodes.contains(tmpRandom) ||
                generatedRandomStrings.contains(tmpRandom)
            );

            sb.Code__c = tmpRandom;
            generatedRandomStrings.add(tmpRandom);
        }
    }
}
