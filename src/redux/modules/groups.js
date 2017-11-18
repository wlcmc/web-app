import { handleActions } from 'redux-actions';
import { fromJS, List } from 'immutable';

import { addNotification } from './notifications';
import { createApiAction } from '../middleware/apiMiddleware';
import factory, { initialState } from '../helpers/resourceManager';

import createRecord from '../helpers/resourceManager/recordFactory';
import { resourceStatus } from '../helpers/resourceManager/status';
import { actionTypes as assignmentsActionTypes } from './assignments';
import { actionTypes as sisSupervisedCoursesActionTypes } from './sisSupervisedCourses';

const resourceName = 'groups';
const { actions, actionTypes, reduceActions } = factory({ resourceName });

/**
 * Actions
 */

export { actionTypes };

export const additionalActionTypes = {
  LOAD_USERS_GROUPS: 'recodex/groups/LOAD_USERS_GROUPS',
  LOAD_USERS_GROUPS_PENDING: 'recodex/groups/LOAD_USERS_GROUPS_PENDING',
  LOAD_USERS_GROUPS_FULFILLED: 'recodex/groups/LOAD_USERS_GROUPS_FULFILLED',
  LOAD_USERS_GROUPS_REJECTED: 'recodex/groups/LOAD_USERS_GROUPS_REJECTED',
  JOIN_GROUP: 'recodex/groups/JOIN_GROUP',
  JOIN_GROUP_PENDING: 'recodex/groups/JOIN_GROUP_PENDING',
  JOIN_GROUP_FULFILLED: 'recodex/groups/JOIN_GROUP_FULFILLED',
  JOIN_GROUP_REJECTED: 'recodex/groups/JOIN_GROUP_REJECTED',
  LEAVE_GROUP: 'recodex/groups/LEAVE_GROUP',
  LEAVE_GROUP_PENDING: 'recodex/groups/LEAVE_GROUP_PENDING',
  LEAVE_GROUP_FULFILLED: 'recodex/groups/LEAVE_GROUP_FULFILLED',
  LEAVE_GROUP_REJECTED: 'recodex/groups/LEAVE_GROUP_REJECTED',
  MAKE_SUPERVISOR: 'recodex/groups/MAKE_SUPERVISOR',
  MAKE_SUPERVISOR_PENDING: 'recodex/groups/MAKE_SUPERVISOR_PENDING',
  MAKE_SUPERVISOR_FULFILLED: 'recodex/groups/MAKE_SUPERVISOR_FULFILLED',
  MAKE_SUPERVISOR_REJECTED: 'recodex/groups/MAKE_SUPERVISOR_REJECTED',
  REMOVE_SUPERVISOR: 'recodex/groups/REMOVE_SUPERVISOR',
  REMOVE_SUPERVISOR_PENDING: 'recodex/groups/REMOVE_SUPERVISOR_PENDING',
  REMOVE_SUPERVISOR_FULFILLED: 'recodex/groups/REMOVE_SUPERVISOR_FULFILLED',
  REMOVE_SUPERVISOR_REJECTED: 'recodex/groups/REMOVE_SUPERVISOR_REJECTED',
  ADD_ADMIN: 'recodex/groups/ADD_ADMIN',
  ADD_ADMIN_PENDING: 'recodex/groups/ADD_ADMIN_PENDING',
  ADD_ADMIN_FULFILLED: 'recodex/groups/ADD_ADMIN_FULFILLED',
  ADD_ADMIN_REJECTED: 'recodex/groups/ADD_ADMIN_REJECTED',
  REMOVE_ADMIN: 'recodex/groups/REMOVE_ADMIN',
  REMOVE_ADMIN_PENDING: 'recodex/groups/REMOVE_ADMIN_PENDING',
  REMOVE_ADMIN_FULFILLED: 'recodex/groups/REMOVE_ADMIN_FULFILLED',
  REMOVE_ADMIN_REJECTED: 'recodex/groups/REMOVE_ADMIN_REJECTED'
};

export const loadGroup = actions.pushResource;
export const fetchGroupsIfNeeded = actions.fetchIfNeeded;
export const fetchGroupIfNeeded = actions.fetchOneIfNeeded;

export const validateAddGroup = (name, instanceId, parentGroupId = null) =>
  createApiAction({
    type: 'VALIDATE_ADD_GROUP_DATA',
    endpoint: '/groups/validate-add-group-data',
    method: 'POST',
    body:
      parentGroupId === null
        ? { name, instanceId }
        : { name, instanceId, parentGroupId }
  });

export const fetchSubgroups = groupId =>
  actions.fetchMany({
    endpoint: `/groups/${groupId}/subgroups`,
    meta: { groupId }
  });

export const fetchUsersGroups = userId =>
  createApiAction({
    type: additionalActionTypes.LOAD_USERS_GROUPS,
    endpoint: `/users/${userId}/groups`,
    method: 'GET',
    meta: { userId }
  });

export const fetchInstanceGroupsIfNeeded = instanceId =>
  actions.fetchMany({
    endpoint: `/instances/${instanceId}/groups`,
    meta: { instanceId }
  });

export const fetchUsersGroupsIfNeeded = userId => (dispatch, getState) => {
  const user = getState().users.getIn(['resources', userId]);
  if (user) {
    dispatch(fetchUsersGroups(userId));
  }
};

export const createGroup = actions.addResource;
export const editGroup = actions.updateResource;
export const deleteGroup = actions.removeResource;

export const joinGroup = (groupId, userId) => dispatch =>
  dispatch(
    createApiAction({
      type: additionalActionTypes.JOIN_GROUP,
      endpoint: `/groups/${groupId}/students/${userId}`,
      method: 'POST',
      meta: { groupId, userId }
    })
  ).catch(() => dispatch(addNotification('Cannot join group.', false))); // @todo: Make translatable

export const leaveGroup = (groupId, userId) => dispatch =>
  dispatch(
    createApiAction({
      type: additionalActionTypes.LEAVE_GROUP,
      endpoint: `/groups/${groupId}/students/${userId}`,
      method: 'DELETE',
      meta: { groupId, userId }
    })
  ).catch(() => dispatch(addNotification('Cannot leave group.', false))); // @todo: Make translatable

export const makeSupervisor = (groupId, userId) => dispatch =>
  dispatch(
    createApiAction({
      type: additionalActionTypes.MAKE_SUPERVISOR,
      endpoint: `/groups/${groupId}/supervisors/${userId}`,
      method: 'POST',
      meta: { groupId, userId }
    })
  ).catch(() =>
    dispatch(
      addNotification('Cannot make this person supervisor of the group.', false)
    )
  ); // @todo: Make translatable

export const removeSupervisor = (groupId, userId) => dispatch =>
  dispatch(
    createApiAction({
      type: additionalActionTypes.REMOVE_SUPERVISOR,
      endpoint: `/groups/${groupId}/supervisors/${userId}`,
      method: 'DELETE',
      meta: { groupId, userId }
    })
  ).catch(() => dispatch(addNotification('Cannot remove supervisor.', false))); // @todo: Make translatable

export const addAdmin = (groupId, userId) => dispatch =>
  dispatch(
    createApiAction({
      type: additionalActionTypes.ADD_ADMIN,
      endpoint: `/groups/${groupId}/admin`,
      method: 'POST',
      meta: { groupId, userId },
      body: { userId }
    })
  ).catch(() =>
    dispatch(
      addNotification('Cannot make this person admin of the group.', false)
    )
  ); // @todo: Make translatable

export const removeAdmin = (groupId, userId) => dispatch =>
  dispatch(
    createApiAction({
      type: additionalActionTypes.REMOVE_ADMIN,
      endpoint: `/groups/${groupId}/admin/${userId}`,
      method: 'DELETE',
      meta: { groupId, userId }
    })
  ).catch(() =>
    dispatch(
      addNotification(
        'Cannot remove this person from admins of the group.',
        false
      )
    )
  ); // @todo: Make translatable

/**
 * Reducer
 */

const reducer = handleActions(
  Object.assign({}, reduceActions, {
    [actionTypes.ADD_FULFILLED]: (state, action) => {
      if (reduceActions[actionTypes.ADD_FULFILLED]) {
        state = reduceActions[actionTypes.ADD_FULFILLED](state, action);
      }

      // update the new hierarchy inside the local state
      const { payload: group } = action;
      if (
        group.parentGroupId === null ||
        !state.getIn(['resources', group.parentGroupId])
      ) {
        return state;
      }

      return state.updateIn(
        ['resources', group.parentGroupId, 'data', 'childGroups', 'all'],
        children => children.push(group.id)
      );
    },

    [actionTypes.REMOVE_FULFILLED]: (state, action) => {
      const removeFulfilled = reduceActions[actionTypes.REMOVE_FULFILLED];
      return removeFulfilled(state, action).update('resources', groups =>
        groups.map(
          group =>
            group.get('data') !== null
              ? group.updateIn(['data', 'childGroups', 'all'], all =>
                  all.filter(groupId => groupId !== action.meta.id)
                )
              : null
        )
      );
    },

    [additionalActionTypes.UPDATE_GROUP_FULFILLED]: (
      state,
      { payload: { parentGroupId, isPublic }, meta: { groupId, userId } }
    ) =>
      state.hasIn(['resources', parentGroupId, 'data'])
        ? state.updateIn(
            ['resources', parentGroupId, 'data', 'childGroups', 'public'],
            groups =>
              isPublic
                ? groups.push(groupId).toSet().toList()
                : groups.filter(id => id !== groupId)
          )
        : state,

    [additionalActionTypes.JOIN_GROUP_PENDING]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.hasIn(['resources', groupId, 'data'])
        ? state.updateIn(['resources', groupId, 'data', 'students'], students =>
            students.push(userId)
          )
        : state,

    [additionalActionTypes.JOIN_GROUP_REJECTED]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.hasIn(['resources', groupId, 'data'])
        ? state.updateIn(['resources', groupId, 'data', 'students'], students =>
            students.filter(id => id !== userId)
          )
        : state,

    [additionalActionTypes.LEAVE_GROUP_FULFILLED]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.updateIn(['resources', groupId, 'data', 'students'], students =>
        students.filter(id => id !== userId)
      ),

    [additionalActionTypes.MAKE_SUPERVISOR_FULFILLED]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.updateIn(
        ['resources', groupId, 'data', 'supervisors'],
        supervisors =>
          supervisors.push(
            fromJS(payload.supervisors.find(id => id === userId))
          )
      ),

    [additionalActionTypes.REMOVE_SUPERVISOR_FULFILLED]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.updateIn(
        ['resources', groupId, 'data', 'supervisors'],
        supervisors => supervisors.filter(id => id !== userId)
      ),

    [additionalActionTypes.ADD_ADMIN_PENDING]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.updateIn(
        ['resources', groupId, 'data', 'primaryAdminsIds'],
        admins => admins.filter(id => id !== userId).concat([userId])
      ),

    [additionalActionTypes.ADD_ADMIN_FAILED]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.updateIn(
        ['resources', groupId, 'data', 'primaryAdminsIds'],
        admins => admins.filter(id => id !== userId)
      ),

    [additionalActionTypes.ADD_ADMIN_FULFILLED]: (
      state,
      { payload: { primaryAdminsIds, admins }, meta: { groupId } }
    ) =>
      state.updateIn(['resources', groupId, 'data'], group =>
        group
          .set('admins', List(admins))
          .set('primaryAdminsIds', primaryAdminsIds)
      ),

    [additionalActionTypes.REMOVE_ADMIN_PENDING]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.updateIn(
        ['resources', groupId, 'data', 'primaryAdminsIds'],
        admins => admins.filter(id => id !== userId)
      ),

    [additionalActionTypes.REMOVE_ADMIN_FAILED]: (
      state,
      { payload, meta: { groupId, userId } }
    ) =>
      state.updateIn(
        ['resources', groupId, 'data', 'primaryAdminsIds'],
        admins => admins.filter(id => id !== userId).concat([userId])
      ),

    [additionalActionTypes.REMOVE_ADMIN_FULFILLED]: (
      state,
      { payload: { primaryAdminsIds, admins }, meta: { groupId } }
    ) =>
      state.updateIn(['resources', groupId, 'data'], group =>
        group
          .set('admins', List(admins))
          .set('primaryAdminsIds', primaryAdminsIds)
      ),

    [additionalActionTypes.LOAD_USERS_GROUPS_FULFILLED]: (
      state,
      { payload, ...rest }
    ) => {
      const groups = [...payload.supervisor, ...payload.student];
      return reduceActions[actionTypes.FETCH_MANY_FULFILLED](state, {
        ...rest,
        payload: groups
      });
    },

    [assignmentsActionTypes.UPDATE_FULFILLED]: (
      state,
      { payload: { id: assignmentId, isPublic, groupId } }
    ) =>
      state.updateIn(
        ['resources', groupId, 'data', 'assignments', 'public'],
        assignments => {
          if (isPublic) {
            return assignments.push(assignmentId).toSet().toList();
          } else {
            return assignments
              .filter(id => id !== assignmentId)
              .toSet()
              .toList();
          }
        }
      ),

    [assignmentsActionTypes.ADD_FULFILLED]: (
      state,
      { payload: { id: assignmentId }, meta: { body: { groupId } } }
    ) =>
      state.updateIn(
        ['resources', groupId, 'data', 'assignments', 'all'],
        assignments => {
          if (!assignments) {
            assignments = List();
          }
          return assignments.push(assignmentId);
        }
      ),

    [assignmentsActionTypes.REMOVE_FULFILLED]: (
      state,
      { meta: { id: assignmentId } }
    ) =>
      state.update('resources', groups =>
        groups.map(group =>
          group.updateIn(['data', 'assignments'], assignments =>
            assignments
              .update('all', ids => ids.filter(id => id !== assignmentId))
              .update('public', ids => ids.filter(id => id !== assignmentId))
          )
        )
      ),

    [sisSupervisedCoursesActionTypes.CREATE_FULFILLED]: (
      state,
      { payload: data }
    ) =>
      state.setIn(
        ['resources', data.id],
        createRecord({ state: resourceStatus.FULFILLED, data })
      )
  }),
  initialState
);

export default reducer;
