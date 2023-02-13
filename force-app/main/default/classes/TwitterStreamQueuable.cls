public with sharing class TwitterStreamQueuable implements Queueable, Database.AllowsCallouts {
    public void execute(QueueableContext qc) {
        Trailblazer_Event__c de = EventAppCtrl.getActiveEvent();
        String dateFilter = de.Start_Date__c.formatGmt(
            'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''
        );
        Set<String> usernames = makeCallout(null, dateFilter);

        List<Event_Attendees__c> attendees = [
            SELECT Id
            FROM Event_Attendees__c
            WHERE
                Twitter_handle__c IN :usernames
                AND Trailblazer_Event__c = :de.Id
        ];
        for (Event_Attendees__c da : attendees) {
            da.Tweet__c = true;
        }
        update attendees;

        // de.Last_Tweet_Sync__c = DateTime.now().addMinutes(-1);
        // update de;
    }

    public Set<String> makeCallout(String nextToken, String dateFilter) {
        String endpoint =
            'https://api.twitter.com/2/tweets/search/recent?query=' +
            EncodingUtil.urlDecode(Label.EventHashTag, 'UTF-8') +
            '&user.fields=id%2Cusername&max_results=100&tweet.fields=author_id&expansions=author_id';
        if (nextToken != null) {
            endpoint = endpoint + '&next_token=' + nextToken;
        }
        if (dateFilter != null) {
            endpoint =
                endpoint +
                '&start_time=' +
                EncodingUtil.urlEncode(dateFilter, 'UTF-8');
        }
        Http h = new Http();
        HttpRequest req = new HttpRequest();
        req.setHeader('Authorization', 'Bearer <YOUR_TWITTER_TOKEN_HERE>');
        req.setEndpoint(endpoint);
        req.setMethod('GET');
        HttpResponse res = h.send(req);
        String body = res.getBody();
        system.debug(body);
        TwitterResponse tr = (TwitterResponse) JSON.deserialize(
            body,
            TwitterResponse.class
        );
        Set<String> usernames = new Set<String>();
        if (tr.includes?.users != null) {
            for (Users u : tr.includes.users) {
                usernames.add(u.username);
            }
        }
        if (tr.meta.next_token != null) {
            usernames.addAll(makeCallout(tr.meta.next_token, dateFilter));
        }
        return usernames;
    }

    public class Includes {
        public List<Users> users;
    }

    public class Meta {
        public String newest_id;
        public String oldest_id;
        public Integer result_count;
        public String next_token;
    }

    public class TwitterResponse {
        public List<Data> data;
        public Includes includes;
        public Meta meta;
    }

    public class Data {
        public String author_id;
        public String id;
        public String text;
    }

    public class Users {
        public String id;
        public String name;
        public String username;
    }
}
