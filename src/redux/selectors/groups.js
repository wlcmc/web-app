import { createSelector } from 'reselect';
import { EMPTY_LIST, EMPTY_MAP, EMPTY_ARRAY } from '../../helpers/common';

import {
  studentOfGroupsIdsSelector,
  supervisorOfGroupsIdsSelector,
  isLoggedAsSuperAdmin
} from './users';
import { getAssignments } from './assignments';
import { getShadowAssignments } from './shadowAssignments';
import { isReady, getId, getJsData } from '../helpers/resourceManager';
import { loggedInUserIdSelector } from './auth';

/**
 * Select groups part of the state
 */
const getParam = (state, id) => id;

export const groupsSelector = state => state.groups.get('resources');

export const notArchivedGroupsSelector = state =>
  state.groups
    .get('resources')
    .filter(isReady)
    .filter(group => group.getIn(['data', 'archived']) === false);

export const filterGroups = (ids, groups) =>
  groups.filter(isReady).filter(group => ids.contains(getId(group)));

export const filterNonOrganizationalActiveGroups = groups =>
  groups.filter(
    group =>
      !group.getIn(['data', 'organizational'], false) &&
      !group.getIn(['data', 'archived'], false)
  );

export const groupSelector = createSelector(
  [groupsSelector, getParam],
  (groups, id) => groups.get(id)
);

export const groupSelectorCreator = id =>
  createSelector(groupsSelector, groups => groups.get(id));

// This is perhaps the best way how to create simple accessor (selector with parameter).
export const groupDataAccessorSelector = createSelector(
  groupsSelector,
  groups => groupId => groups.getIn([groupId, 'data'], EMPTY_MAP)
);

export const studentOfSelector = userId =>
  createSelector(
    [studentOfGroupsIdsSelector(userId), groupsSelector],
    filterGroups
  );

export const supervisorOfSelector = userId =>
  createSelector(
    [supervisorOfGroupsIdsSelector(userId), groupsSelector],
    filterGroups
  );

export const studentOfSelector2 = userId =>
  createSelector(groupsSelector, groups =>
    groups
      .filter(isReady)
      .map(getJsData)
      .filter(
        group =>
          group.privateData && group.privateData.students.indexOf(userId) >= 0
      )
  );

export const supervisorOfSelector2 = userId =>
  createSelector(groupsSelector, groups =>
    groups
      .filter(isReady)
      .map(getJsData)
      .filter(
        group =>
          group.privateData &&
          group.privateData.supervisors.indexOf(userId) >= 0
      )
  );

export const adminOfSelector = userId =>
  createSelector(groupsSelector, groups =>
    groups
      .filter(isReady)
      .map(getJsData)
      .filter(
        group =>
          group.privateData && group.privateData.admins.indexOf(userId) >= 0
      )
  );

export const groupsUserCanEditSelector = createSelector(
  [
    loggedInUserIdSelector,
    groupsSelector,
    state => isLoggedAsSuperAdmin(state)
  ],
  (userId, groups, isSuperAdmin) =>
    groups.filter(isReady).filter(group => {
      if (isSuperAdmin) {
        return true;
      }
      const groupData = getJsData(group);
      return (
        groupData.privateData &&
        (groupData.privateData.supervisors.indexOf(userId) >= 0 ||
          groupData.privateData.admins.indexOf(userId) >= 0)
      );
    })
);

export const groupsUserCanAssignToSelector = createSelector(
  groupsUserCanEditSelector,
  filterNonOrganizationalActiveGroups
);

const usersOfGroup = (type, groupId) =>
  createSelector(
    groupSelectorCreator(groupId),
    group =>
      group && isReady(group)
        ? group.getIn(['data', 'privateData', type], EMPTY_LIST)
        : EMPTY_LIST
  );

export const studentsOfGroup = groupId => usersOfGroup('students', groupId);
export const supervisorsOfGroup = groupId =>
  usersOfGroup('supervisors', groupId);
export const adminsOfGroup = groupId => usersOfGroup('admins', groupId);

export const groupsAssignmentsSelector = createSelector(
  [groupsSelector, getAssignments, getParam],
  (groups, assignments, groupId) =>
    groups
      .getIn([groupId, 'data', 'privateData', 'assignments'], EMPTY_LIST)
      .map(id => assignments.getIn(['resources', id]))
);

export const groupsShadowAssignmentsSelector = createSelector(
  [groupsSelector, getShadowAssignments, getParam],
  (groups, shadowAssignments, groupId) =>
    groups
      .getIn([groupId, 'data', 'privateData', 'shadowAssignments'], EMPTY_LIST)
      .map(id => shadowAssignments.getIn(['resources', id]))
);

const getGroupParentIds = (id, groups) => {
  const group = groups.get(id);
  if (group && isReady(group)) {
    const data = group.get('data');
    return data.get('parentGroupId') !== null
      ? [data.get('id')].concat(
          getGroupParentIds(data.get('parentGroupId'), groups)
        )
      : [data.get('id')];
  } else {
    return EMPTY_ARRAY;
  }
};

export const allParentIdsForGroup = id =>
  createSelector(groupsSelector, groups => getGroupParentIds(id, groups));

export const groupOrganizationalPendingChange = id =>
  createSelector(
    groupsSelector,
    groups => groups && groups.getIn([id, 'pending-organizational'], false)
  );

export const groupArchivedPendingChange = id =>
  createSelector(
    groupsSelector,
    groups => groups && groups.getIn([id, 'pending-archived'], false)
  );
