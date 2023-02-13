public with sharing class TwitterStreamSchedulable implements Schedulable {
    public void execute(SchedulableContext sc) {
        System.enqueueJob(new TwitterStreamQueuable());
    }
}
