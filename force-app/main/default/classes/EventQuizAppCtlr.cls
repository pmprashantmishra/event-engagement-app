public with sharing class EventQuizAppCtlr {
    @AuraEnabled
    public static Quiz__c getActiveQuizEvent(String activeEventId){
        List<Quiz__c> quizList = new List<Quiz__c>([SELECT Quiz_Time__c, Questions__c FROM Quiz__c WHERE IsActive__c = true AND Trailblazer_Event__c =: activeEventId]);
        if(!quizList.isEmpty()){
            return quizList[0];
        }
        return null;
    }
}