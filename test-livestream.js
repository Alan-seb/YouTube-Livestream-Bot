/**
 * Test script to check livestream access
 */
require('dotenv').config();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

async function testLivestreamAccess() {
  try {
    console.log('Testing livestream access...');
    
    // Create OAuth2 client with owner credentials
    const oauth2Client = new OAuth2Client(
      process.env.OWNER_CLIENT_ID,
      process.env.OWNER_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.OWNER_REFRESH_TOKEN
    });

    // Create YouTube API client
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    console.log('OAuth client created successfully');
    console.log('Credentials loaded from .env file');
    console.log('Owner Client ID:', process.env.OWNER_CLIENT_ID?.substring(0, 10) + '...');
    console.log('Owner Refresh Token:', process.env.OWNER_REFRESH_TOKEN?.substring(0, 10) + '...');
    
    // First test: Check if we can access the YouTube API at all
    console.log('\nTest 1: Checking YouTube API access...');
    const channelResponse = await youtube.channels.list({
      part: 'snippet',
      mine: true
    });
    
    if (channelResponse.data.items && channelResponse.data.items.length > 0) {
      console.log('✅ Success! YouTube API access confirmed');
      console.log('Channel Name:', channelResponse.data.items[0].snippet.title);
    } else {
      console.log('❌ Error: Could not access channel information');
    }

    // Test 2: Try to get the video
    console.log('\nTest 2: Getting video details...');
    const videoId = process.env.YOUTUBE_VIDEO_ID || 'FzRT2dsl_w0';
    console.log('Testing video ID:', videoId);
    
    const videoResponse = await youtube.videos.list({
      part: 'snippet,liveStreamingDetails',
      id: videoId
    });

    if (videoResponse.data.items && videoResponse.data.items.length > 0) {
      console.log('✅ Success! Video found');
      console.log('Video Title:', videoResponse.data.items[0].snippet.title);
      
      // Check if this is a livestream
      const liveStreamingDetails = videoResponse.data.items[0].liveStreamingDetails;
      if (liveStreamingDetails) {
        console.log('✅ This is a livestream video');
        
        if (liveStreamingDetails.activeLiveChatId) {
          console.log('✅ Live chat is enabled and accessible');
          console.log('Live Chat ID:', liveStreamingDetails.activeLiveChatId);
          
          // Test 3: Try to access the live chat
          console.log('\nTest 3: Accessing live chat messages...');
          const chatResponse = await youtube.liveChatMessages.list({
            part: 'snippet,authorDetails',
            liveChatId: liveStreamingDetails.activeLiveChatId,
            maxResults: 10
          });
          
          console.log('✅ Success! Retrieved', chatResponse.data.items?.length || 0, 'chat messages');
          if (chatResponse.data.items && chatResponse.data.items.length > 0) {
            console.log('Most recent message:', chatResponse.data.items[0].snippet.displayMessage);
          }
        } else {
          console.log('❌ Error: Live chat is not enabled for this stream');
          console.log('Possible reasons:');
          console.log('1. The stream is not currently live (it might be scheduled but not started)');
          console.log('2. Live chat has been disabled in the stream settings');
          console.log('3. The stream ended and is no longer live');
          console.log('\nLive streaming details:', liveStreamingDetails);
        }
      } else {
        console.log('❌ Error: This is not a livestream video');
      }
    } else {
      console.log('❌ Error: Could not find the video');
      console.log('Make sure the video ID is correct and the video is public or unlisted');
      console.log('Full response:', videoResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:');
    console.error(error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
  }
}

testLivestreamAccess().catch(console.error); 