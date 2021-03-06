import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { _ } from 'meteor/underscore';
import { GamerProfiles } from '/imports/api/profile/GamerProfileCollection';
import { Games } from '/imports/api/interest/GameCollection';
import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor'

const displaySuccessMessage = 'displaySuccessMessage';
const displayErrorMessages = 'displayErrorMessages';

Template.Gamer_Profile_Page.onCreated(function onCreated() {
  this.subscribe(Games.getPublicationName());
  this.subscribe(GamerProfiles.getPublicationName());
  this.messageFlags = new ReactiveDict();
  this.messageFlags.set(displaySuccessMessage, false);
  this.messageFlags.set(displayErrorMessages, false);
  this.context = GamerProfiles.getSchema().namedContext('Gamer_Profile_Page');
});

Template.Gamer_Profile_Page.helpers({
  successClass() {
    return Template.instance().messageFlags.get(displaySuccessMessage) ? 'success' : '';
  },
  displaySuccessMessage() {
    return Template.instance().messageFlags.get(displaySuccessMessage);
  },
  errorClass() {
    return Template.instance().messageFlags.get(displayErrorMessages) ? 'error' : '';
  },
  profile() {
    return GamerProfiles.findDoc(FlowRouter.getParam('username'));
  },
  games() {
    const profile = GamerProfiles.findDoc(FlowRouter.getParam('username'));
    const selectedGames = profile.games;
    return profile && _.map(Games.findAll(),
            function makeGameObject(game) {
              return { label: game.name, selected: _.contains(selectedGames, game.name) };
            });
  },
  gamesReturned() {
    const profile = GamerProfiles.findDoc(FlowRouter.getParam('username'));
    var toReturn = profile.games;
    // console.log(toReturn);
    return toReturn;
  },

  opGG(){
    const profile = GamerProfiles.findDoc(FlowRouter.getParam('username'));
    const opGGER = 'http://na.op.gg/summoner/userName='
    return opGGER +  profile.league;
  },
  steamNamerGive(){
    const profile = GamerProfiles.findDoc(FlowRouter.getParam('username'));
    const steamName ="http://steamcommunity.com/id/";
    return steamName + profile.steam;
  },

  leagueRequest(){
      const profile = GamerProfiles.findDoc(FlowRouter.getParam('username'));
      var request ='https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/';
      var apiAppender = '?api_key=';
      var LeagueKey = 'XXXXX-XXXXXXX-XXXXXX';
      var URLsending = request + profile.league +apiAppender + LeagueKey;
    },
});


Template.Gamer_Profile_Page.events({
  'submit .profile-data-form'(event, instance) {
    event.preventDefault();
    const firstName = event.target.First.value;
    const lastName = event.target.Last.value;
    // const title = event.target.Title.value;
    const username = FlowRouter.getParam('username'); // schema requires username.
    let picture = event.target.Picture.value;
    const steam = event.target.Steam.value;
    const blizzard = event.target.Blizzard.value;
    const league = event.target.LoL.value;
    const bio = event.target.Bio.value;
    const selectedGames = _.filter(event.target.Games.selectedOptions, (option) => option.selected);
    const games = _.map(selectedGames, (option) => option.value);

    if (picture === '') {
      picture = 'http://www.bestmachine.online/uploads/42/1024px-No_image_available.svg.png';
    }

    const updatedProfileData = { firstName, lastName, picture, steam, blizzard, league, bio, games,
      username };

    // Clear out any old validation errors.
    instance.context.reset();
    // Invoke clean so that updatedProfileData reflects what will be inserted.
    const cleanData = GamerProfiles.getSchema().clean(updatedProfileData);
    // Determine validity.
    instance.context.validate(cleanData);

    if (instance.context.isValid()) {
      const docID = GamerProfiles.findDoc(FlowRouter.getParam('username'))._id;
      const id = GamerProfiles.update(docID, { $set: cleanData });
      instance.messageFlags.set(displaySuccessMessage, id);
      instance.messageFlags.set(displayErrorMessages, false);
    } else {
      instance.messageFlags.set(displaySuccessMessage, false);
      instance.messageFlags.set(displayErrorMessages, true);
    }
  },
});
