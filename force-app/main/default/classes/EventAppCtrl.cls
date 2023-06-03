public without sharing class EventAppCtrl {
    @AuraEnabled
    public static Trailblazer_Event__c getActiveEvent() {
        List<Trailblazer_Event__c> events = [
            SELECT Id, Check_In_Closed__c, Event_Phase__c, Name, Start_Date__c
            FROM Trailblazer_Event__c
            WHERE Active__c = TRUE
        ];
        if (!events.isEmpty()) {
            return events[0];
        }
        return null;
    }

    @AuraEnabled
    public static String getAttendeeByEmail(String email, String eventId) {
        Map<String, Object> result = new Map<String, Object>();
        List<Event_Attendees__c> attendees = [
            SELECT Id, Name, AttendeeExtId__c, Checked_In__c, Pre_Registered__c
            FROM Event_Attendees__c
            WHERE Email_Address__c = :email AND Trailblazer_Event__c = :eventId
        ];
        Trailblazer_Event__c event = [
            SELECT Id, Check_In_Closed__c
            FROM Trailblazer_Event__c
            WHERE Id = :eventId
        ];
        result.put('checkInClosed', event.Check_In_Closed__c);
        if (!attendees.isEmpty()) {
            result.put('attendeeId', attendees[0].Id);
            result.put('alreadyCheckedIn', attendees[0].Checked_In__c);
        }
        return JSON.serialize(result);
    }

    @AuraEnabled
    public static Event_Attendees__c getAttendeeById(String attendeeId) {
        Trailblazer_Event__c de = getActiveEvent();
        if (de != null) {
            List<Event_Attendees__c> attendees = [
                SELECT
                    Id,
                    Name,
                    Unique_Key__c,
                    Team_Name__c,
                    AttendeeExtId__c,
                    Pre_Registered__c
                FROM Event_Attendees__c
                WHERE Id = :attendeeId AND Trailblazer_Event__c = :de.Id
            ];
            if (!attendees.isEmpty()) {
                return attendees[0];
            }
        }
        return null;
    }

    @AuraEnabled
    public static Boolean updateAttendee(
        String attendeeId,
        String twitterHandle,
        String skills,
        Boolean fromQuest
    ) {
        try {
            Event_Attendees__c attendee = new Event_Attendees__c(
                Id = attendeeId
            );
            if (!String.isBlank(twitterHandle)) {
                attendee.Twitter_handle__c = twitterHandle;
            }
            if (!String.isBlank(skills)) {
                attendee.Skills__c = skills;
                attendee.Checked_In__c = true;
            }
            if (fromQuest == true) {
                attendee.Updated_Twitter_Handle__c = true;
            }
            update attendee;
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @AuraEnabled
    public static Boolean saveActivity(
        String eventId,
        String attendeeId,
        String activityType,
        String activitySubType,
        String value,
        String additionalInfo
    ) {
        try {
            Event_Activity__c ea = new Event_Activity__c();
            ea.Trailblazer_Event__c = eventId;
            ea.Event_Attendee__c = attendeeId;
            ea.Type__c = activityType;
            ea.Sub_Type__c = activitySubType;
            ea.Value__c = value;
            ea.Additional_Info__c = additionalInfo;
            insert ea;
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @AuraEnabled
    public static Event_Attendees__c getQuestMetrics(String attendeeId) {
        try {
            return [
                SELECT
                    Id,
                    Visited_a_Booth__c,
                    Number_of_sessions_attended__c,
                    Number_of_feedbacks_given__c,
                    Number_of_people_met__c,
                    Met_a_speaker__c,
                    Met_a_volunteer__c,
                    Give_event_feedback__c,
                    Play_a_game__c,
                    Tweet__c,
                    Twitter_handle__c,
                    Updated_Twitter_Handle__c
                FROM Event_Attendees__c
                WHERE Id = :attendeeId
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static CustomResponse isSecretValid(
        String secret,
        String eventId,
        String attendeeId
    ) {
        try {
            CustomResponse cr = new CustomResponse();
            List<Event_Attendees__c> attendees = [
                SELECT Id, Is_Speaker__c, Is_Volunteer__c
                FROM Event_Attendees__c
                WHERE
                    Unique_Key__c = :secret
                    AND Trailblazer_Event__c = :eventId
                    AND Checked_In__c = TRUE
                    AND Id != :attendeeId
            ];
            if (attendees.size() >= 1) {
                List<Event_Activity__c> allActivities = [
                    SELECT Id
                    FROM Event_Activity__c
                    WHERE
                        Event_Attendee__c = :attendeeId
                        AND Value__c = :secret
                        AND Type__c = 'Interaction'
                ];
                if (allActivities.size() == 0) {
                    // Insert event activity
                    String attendeeType;
                    if (attendees[0].Is_Speaker__c == true) {
                        attendeeType = 'Speaker';
                    } else if (attendees[0].Is_Volunteer__c == true) {
                        attendeeType = 'Volunteer';
                    }
                    Boolean saved = saveActivity(
                        eventId,
                        attendeeId,
                        'Interaction',
                        null,
                        secret,
                        attendeeType
                    );
                    if (saved == true) {
                        cr.isSuccess = true;
                    } else {
                        cr.isSuccess = false;
                        cr.message = 'Unable to save interaction. Please contact event staff.';
                    }
                } else {
                    // return interaction already addded
                    cr.isSuccess = false;
                    cr.message = 'An interaction with this person is already added.';
                }
            } else {
                cr.isSuccess = false;
                cr.message = 'Invalid code scanned, or this person has not checked in to the event.';
            }
            return cr;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public static void syncMetrics(Set<Id> attendeeIds) {
        Map<Id, List<Event_Activity__c>> attendeeActivityMap = new Map<Id, List<Event_Activity__c>>();
        Map<Id, List<Session_Booth_Attendance__c>> attendeeAttendanceMap = new Map<Id, List<Session_Booth_Attendance__c>>();

        List<Event_Activity__c> allActivities = [
            SELECT
                Event_Attendee__c,
                Sub_Type__c,
                Type__c,
                Value__c,
                Additional_Info__c
            FROM Event_Activity__c
            WHERE Event_Attendee__c IN :attendeeIds
        ];
        for (Event_Activity__c ea : allActivities) {
            List<Event_Activity__c> acts = attendeeActivityMap.get(
                ea.Event_Attendee__c
            );
            if (acts == null) {
                acts = new List<Event_Activity__c>();
            }
            acts.add(ea);
            attendeeActivityMap.put(ea.Event_Attendee__c, acts);
        }

        List<Session_Booth_Attendance__c> allAttendance = [
            SELECT Id, Event_Attendee__c, Session_Booth__r.Type__c
            FROM Session_Booth_Attendance__c
            WHERE Event_Attendee__c IN :attendeeIds
        ];
        for (Session_Booth_Attendance__c sb : allAttendance) {
            List<Session_Booth_Attendance__c> acts = attendeeAttendanceMap.get(
                sb.Event_Attendee__c
            );
            if (acts == null) {
                acts = new List<Session_Booth_Attendance__c>();
            }
            acts.add(sb);
            attendeeAttendanceMap.put(sb.Event_Attendee__c, acts);
        }

        List<Event_Attendees__c> attendeesToUpdate = new List<Event_Attendees__c>();
        for (Id attendeeId : attendeeActivityMap.keySet()) {
            Boolean visitedBooth = false;
            Integer sessionsAttended = 0;
            Integer feedbackGiven = 0;
            Integer peopleInteracted = 0;
            Boolean metVolunteer = false;
            Boolean metSpeaker = false;
            Boolean finishedGame = false;
            Boolean gaveEventFeedback = false;

            List<Event_Activity__c> acts = attendeeActivityMap.get(attendeeId);
            if (acts != null) {
                for (Event_Activity__c act : acts) {
                    if (
                        act.Type__c == 'Vote' &&
                        act.Sub_Type__c?.startsWith('session_feedback')
                    ) {
                        feedbackGiven++;
                    }
                    if (
                        act.Type__c == 'Vote' &&
                        act.Sub_Type__c == 'eventFeedback'
                    ) {
                        gaveEventFeedback = true;
                    }
                    if (act.Type__c == 'Game 1' || act.Type__c == 'Game 2') {
                        finishedGame = true;
                    }
                    if (act.Type__c == 'Interaction') {
                        peopleInteracted++;
                        if (act.Additional_Info__c == 'Speaker') {
                            metSpeaker = true;
                        }
                        if (act.Additional_Info__c == 'Volunteer') {
                            metVolunteer = true;
                        }
                    }
                }
            }

            List<Session_Booth_Attendance__c> atts = attendeeAttendanceMap.get(
                attendeeId
            );
            if (atts != null) {
                for (Session_Booth_Attendance__c sba : atts) {
                    if (sba.Session_Booth__r.Type__c == 'Session') {
                        sessionsAttended++;
                    }
                    if (sba.Session_Booth__r.Type__c == 'Booth') {
                        visitedBooth = true;
                    }
                }
            }

            attendeesToUpdate.add(
                new Event_Attendees__c(
                    Id = attendeeId,
                    Visited_a_Booth__c = visitedBooth,
                    Number_of_sessions_attended__c = sessionsAttended,
                    Number_of_feedbacks_given__c = feedbackGiven,
                    Number_of_people_met__c = peopleInteracted,
                    Give_event_feedback__c = gaveEventFeedback,
                    Play_a_game__c = finishedGame,
                    Met_a_speaker__c = metSpeaker,
                    Met_a_volunteer__c = metVolunteer
                )
            );
        }
        update attendeesToUpdate;
    }

    @AuraEnabled
    public static String getFeedbackMetrics(
        String eventId,
        String feedbackType
    ) {
        List<Event_Activity__c> ideas = [
            SELECT Id, Sub_Type__c, Value__c
            FROM Event_Activity__c
            WHERE
                Trailblazer_Event__c = :eventId
                AND Sub_Type__c = :feedbackType
                AND Type__c = 'Vote'
        ];
        Decimal total = 0;
        Decimal count = 0;
        List<Map<String, Object>> feedbackComments = new List<Map<String, Object>>();
        Integer mapIndex = 0;
        for (Event_Activity__c ea : ideas) {
            if (ea.Value__c != null) {
                Map<String, Object> m = (Map<String, Object>) JSON.deserializeUntyped(
                    ea.Value__c
                );
                total += Integer.valueOf(m.values()[0]);
                if (m.values().size() == 2) {
                    String feedback = String.valueOf(m.values()[1]);
                    if (feedback != null && feedback.length() > 0) {
                        Map<String, Object> tmpObj = new Map<String, Object>();
                        tmpObj.put('id', mapIndex);
                        tmpObj.put('feedback', feedback);
                        feedbackComments.add(tmpObj);
                        mapIndex++;
                    }
                }
                count++;
            }
        }
        Map<String, Object> results = new Map<String, Object>();
        results.put('count', count);
        results.put('score', count > 0 ? total.divide(count, 2) : 0);
        results.put('comments', feedbackComments);
        return JSON.serialize(results);
    }

    public static String randomString() {
        String[] validChars = new List<string>{
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'J',
            'K',
            'L',
            'M',
            'N',
            'P',
            'Q',
            'R',
            'S',
            'T',
            'U',
            'V',
            'W',
            'X',
            'Y',
            'Z',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9'
        };
        String uniqueString = '';
        Integer validCharsLength = validChars.size();
        for (Integer i = 0; i < 5; i++) {
            uniqueString =
                uniqueString +
                validChars[(Integer) (Math.random() * validCharsLength)];
        }
        return uniqueString;
    }

    @AuraEnabled
    public static String saveSessionBoothAttendance(
        String sessionCode,
        String attendeeId,
        String eventId
    ) {
        CustomResponse cr = new CustomResponse();
        try {
            List<Session_Booth__c> sessionsAndBooths = [
                SELECT Id
                FROM Session_Booth__c
                WHERE Code__c = :sessionCode AND Trailblazer_Event__c = :eventId
                LIMIT 1
            ];
            if (sessionsAndBooths.size() == 1) {
                List<Session_Booth_Attendance__c> sbaList = [
                    SELECT Id
                    FROM Session_Booth_Attendance__c
                    WHERE
                        Event_Attendee__c = :attendeeId
                        AND Session_Booth__c = :sessionsAndBooths[0].Id
                ];
                if (sbaList.size() == 0) {
                    cr.isSuccess = true;
                    Session_Booth_Attendance__c sba = new Session_Booth_Attendance__c();
                    sba.Event_Attendee__c = attendeeId;
                    sba.Session_Booth__c = sessionsAndBooths[0].Id;
                    insert sba;
                    cr.message = sessionsAndBooths[0].Id;
                } else {
                    cr.isSuccess = true;
                    cr.message = sessionsAndBooths[0].Id;
                }
            } else {
                cr.isSuccess = false;
                cr.message = 'This code is not valid.';
            }
        } catch (Exception e) {
            cr.isSuccess = false;
            cr.message = 'An error occurred. Please contact event staff.';
        }

        return JSON.serialize(cr);
    }

    @AuraEnabled
    public static void generateOTP(String recordId) {
        Integer otp = Math.round((Math.random() * (900000) + 100000));
        Session_Booth__c sb = new Session_Booth__c(Id = recordId);
        sb.Password__c = String.valueOf(otp);
        sb.Password_Used__c = false;
        update sb;
    }

    @AuraEnabled
    public static Session_Booth__c login(String sessCode, String otp) {
        Trailblazer_Event__c ev = getActiveEvent();
        List<Session_Booth__c> sb = [
            SELECT Id, Name, Password__c, Password_Used__c
            FROM Session_Booth__c
            WHERE Code__c = :sessCode AND Trailblazer_Event__c = :ev.Id
            LIMIT 1
        ];
        if (sb.size() == 1) {
            if (sb[0].Password__c == otp && sb[0].Password_Used__c == false) {
                sb[0].Password_Used__c = true;
                update sb;
                return sb[0];
            }
        }
        return null;
    }

    @AuraEnabled(cacheable=true)
    public static List<Session_Booth_Attendance__c> getAttendeesForSessionOrBooth(
        String sessionOrBoothId
    ) {
        try {
            if (sessionOrBoothId != null) {
                return [
                    SELECT Id, Event_Attendee__r.Name
                    FROM Session_Booth_Attendance__c
                    WHERE Session_Booth__c = :sessionOrBoothId
                    ORDER BY CreatedDate DESC
                    LIMIT 10
                ];
            }
            return null;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void addAttendance(
        String sessionOrBoothId,
        String attendeeCode
    ) {
        try {
            List<Event_Attendees__c> attendees = [
                SELECT Id
                FROM Event_Attendees__c
                WHERE Unique_Key__c = :attendeeCode AND Checked_In__c = TRUE
            ];
            if (attendees.size() > 0) {
                List<Session_Booth_Attendance__c> sbaList = [
                    SELECT Id
                    FROM Session_Booth_Attendance__c
                    WHERE
                        Event_Attendee__c = :attendees[0].Id
                        AND Session_Booth__c = :sessionOrBoothId
                ];
                if (sbaList.size() == 0) {
                    Session_Booth_Attendance__c sba = new Session_Booth_Attendance__c();
                    sba.Event_Attendee__c = attendees[0].Id;
                    sba.Session_Booth__c = sessionOrBoothId;
                    insert sba;
                } else {
                    throw new AuraHandledException('Duplicate Entry');
                }
            } else {
                throw new AuraHandledException('Invalid code');
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Event_Attendees__c checkInPerson(String attendeeCode) {
        try {
            List<Event_Attendees__c> attendees = [
                SELECT Id, Name
                FROM Event_Attendees__c
                WHERE Unique_Key__c = :attendeeCode AND Checked_In__c = TRUE
            ];
            if (attendees.size() > 0) {
                update attendees;
                return attendees[0];
            } else {
                throw new AuraHandledException('Invalid code');
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Session_Booth__c> getSessionsAndBoothsForEvent(
        String eventId
    ) {
        return [
            SELECT Id, Name
            FROM Session_Booth__c
            WHERE Trailblazer_Event__c = :eventId
        ];
    }

    @AuraEnabled
    public static string getSurveyResults(String eventId) {
        try {
            List<Event_Activity__c> ideas = [
                SELECT Id, Sub_Type__c, Value__c
                FROM Event_Activity__c
                WHERE
                    Trailblazer_Event__c = :eventId
                    AND Sub_Type__c = 'survey'
                    AND Type__c = 'Vote'
            ];

            Map<String, Integer> updatesCounts = new Map<String, Integer>();
            Map<String, Integer> timeframeCounts = new Map<String, Integer>();
            Map<String, Integer> preferedPlaceCounts = new Map<String, Integer>();
            List<Map<String, Object>> feedbackComments = new List<Map<String, Object>>();

            Integer mapIndex = 0;

            for (Event_Activity__c ea : ideas) {
                if (ea.Value__c != null) {
                    SurveyResponse sr = (SurveyResponse) JSON.deserialize(
                        ea.Value__c,
                        SurveyResponse.class
                    );
                    List<String> tmpValues = sr.updates;
                    for (String s : tmpValues) {
                        Integer i = updatesCounts.get(s);
                        if (i == null) {
                            i = 0;
                        }
                        i++;
                        updatesCounts.put(s, i);
                    }

                    tmpValues = sr.timeframe;
                    for (String s : tmpValues) {
                        Integer i = timeframeCounts.get(s);
                        if (i == null) {
                            i = 0;
                        }
                        i++;
                        timeframeCounts.put(s, i);
                    }

                    tmpValues = sr.preferedPlace;
                    for (String s : tmpValues) {
                        Integer i = preferedPlaceCounts.get(s);
                        if (i == null) {
                            i = 0;
                        }
                        i++;
                        preferedPlaceCounts.put(s, i);
                    }

                    if (sr.notes != null && sr.notes.length() > 0) {
                        Map<String, Object> tmpObj = new Map<String, Object>();
                        tmpObj.put('id', mapIndex);
                        tmpObj.put('feedback', sr.notes);
                        feedbackComments.add(tmpObj);
                        mapIndex++;
                    }
                }
            }

            Map<String, Object> results = new Map<String, Object>();
            results.put('count', ideas.size());
            results.put('comments', feedbackComments);
            results.put('updatesCounts', updatesCounts);
            results.put('timeframeCounts', timeframeCounts);
            results.put('preferedPlaceCounts', preferedPlaceCounts);
            return JSON.serialize(results);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class SurveyResponse {
        public List<String> updates;
        public List<String> timeframe;
        public List<String> preferedPlace;
        public List<String> preferedLength;
        public String notes;
        public String otherValue;
    }

    public class CustomResponse {
        @AuraEnabled
        public Boolean isSuccess;
        @AuraEnabled
        public String message;
    }

    @AuraEnabled
    public static List<EventNameWithIdResponse> getEventNamesWithIds(){
        try {
            List<Trailblazer_Event__c> eventList = [SELECT Id, Name FROM Trailblazer_Event__c];
            List<EventNameWithIdResponse> responeList = new List<EventNameWithIdResponse>();
            for(Trailblazer_Event__c te : eventList) {
                EventNameWithIdResponse response = new EventNameWithIdResponse();
                response.label = te.Name;
                response.value = te.Id;
                responeList.add(response);
            }
            return responeList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class EventNameWithIdResponse {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String value;
    }
}
