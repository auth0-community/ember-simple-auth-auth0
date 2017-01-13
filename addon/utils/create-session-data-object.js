import Ember from 'ember';
const assign = Ember.assign || Ember.merge;

export default function createSessionDataObject(profile, tokenInfo) {
  return assign({}, tokenInfo, { profile });
}
