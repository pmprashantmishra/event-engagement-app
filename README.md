# Event Engagement App

This repo has the source code for the event engagement app used by Salesforce Developer Relations team during the Salesforce Developer Days events.

> **Note**
> This code is for reference only, and is not owned or supported by Salesforce. Anyone who wants to use this code to implement a similar app at their event is solely responsible to make changes, implement best practices and security measures according to their requirements.

> **Note**
> Neither Salesforce nor the owner of this repo will provide a production instance to run this app.  

## Featues
The event engagement app has 2 major modules
### Attendee Engagement Module
- Check in attendees
- Collect Keynote feedback (Opening and Closing) 
- Session/Booth Attendance and feedback: Helps track footfall at booths and sessions. Enter the session/booth code, or scan the QR code to mark attendance, and optionally give feedback.
- Survey: Show a survey with multi-select options
- Game 1: Word Search - Find 6 Salesforce mascots in a grid
- Game 2: Wordle - Find a word in 6 tries or less
- Networking: Scan the QR code of other attendees to track interactions
- Twitter Integration to pull tweets for a hashtag, and map it to an attendee

### Admin Module
- Allows you to control the app phase.
- Shows you a summary of responses from keynote feedback, session and booth feedback and survey.

## Try it in a scratch org
Before deploying the app to your own production instance, I recommend installing it in a scratch org, to try the app and make the required changes.

1. If you haven't already done so, authorize your hub org and provide it with an alias (**myhuborg** in the command below):

    ```
    sfdx auth:web:login -d -a myhuborg
    ```

1. Clone the lwc-recipes repository:

    ```
    git clone https://github.com/adityanaag3/event-engagement-app
    cd event-engagement-app
    ```

1. Create a scratch org and provide it with an alias (**event-engagement-app** in the command below):

    ```
    sfdx force:org:create -s -f config/project-scratch-def.json -a event-engagement-app
    ```

1. Push the app to your scratch org:

    ```
    sfdx force:source:push
    ```

1. Assign the **EventApp** permission set to the default user:

    ```
    sfdx force:user:permset:assign -n EventApp
    ```

1. Import sample data, for Events, Attendees and Sessions:

    ```
    sfdx force:data:tree:import -p ./data/data-plan.json
    ```

1. Open the scratch org:

    ```
    sfdx force:org:open
    ```
    
1. Enable Path from Setup->Path Settings
    

## Make it your own
1. Update the [sf_logo](https://github.com/adityanaag3/event-engagement-app/blob/main/force-app/main/default/staticresources/sf_logo.png) static resource with a PNG logo of your event.
1. Update your event's theme color (preferably a dark color) in [eventApp.css](https://github.com/adityanaag3/event-engagement-app/blob/main/force-app/main/default/lwc/eventApp/eventApp.css#L2), and [eventApp.js](https://github.com/adityanaag3/event-engagement-app/blob/main/force-app/main/default/lwc/eventApp/eventApp.js#L81)
1. Update the [EventHashTag](https://github.com/adityanaag3/event-engagement-app/blob/main/force-app/main/default/labels/CustomLabels.labels-meta.xml#L8) custom label with your event's hashtag.
1. Follow the [instructions here](https://developer.twitter.com/en/docs/tutorials/step-by-step-guide-to-making-your-first-request-to-the-twitter-api-v2) to generate a Bearer Token to access Twitter APIs, and update the [TwitterStreamQueuable class](https://github.com/adityanaag3/event-engagement-app/blob/main/force-app/main/default/classes/TwitterStreamQueuable.cls#L41) with the generated token.
1. Use the TwitterStreamSchedulable class to schedule the Twitter Integration to run at your chosen frequency to fetch the tweets for your hashtag.
1. Add your event name to the `ATTENDEEID_LOCALSTORAGE` constant in [eventApp.js](https://github.com/adityanaag3/event-engagement-app/blob/main/force-app/main/default/lwc/eventApp/eventApp.js#L12)


## Deploy the QR code scanner to Netlify
The QR code scanner is currently hosted on Netlify for faster speeds. The current Netlify instance in the app is a shared instance, and might run out of bandwidth. So it is recommended that you deploy the code to your own instance.

Deploy the code in the `qr-code-scanner` folder to Netlify or GitHub pages, and update the endpoint in the `scanQRCode` component, in both the [HTML](https://github.com/adityanaag3/event-engagement-app/blob/main/force-app/main/default/lwc/scanQRCode/scanQRCode.html#L12) and [JS](https://github.com/adityanaag3/event-engagement-app/blob/main/force-app/main/default/lwc/scanQRCode/scanQRCode.js#L7) files.