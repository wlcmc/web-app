import { handleActions } from 'redux-actions';
import { fromJS } from 'immutable';

import factory, {
  initialState,
  createRecord,
  resourceStatus
} from '../helpers/resourceManager';
import { createApiAction } from '../middleware/apiMiddleware';

import { additionalActionTypes as groupsActionTypes } from './groups';
import { actionTypes as sisSupervisedCoursesActionTypes } from './sisSupervisedCourses';
import { actionTypes as emailVerificationActionTypes } from './emailVerification';
import { actionTypes as paginationActionTypes } from './pagination';
import { actionTypes as exercisesAuthorsActionTypes } from './exercisesAuthors';

import { arrayToObject } from '../../helpers/common';

export const additionalActionTypes = {
  VALIDATE_REGISTRATION_DATA: 'recodex/users/VALIDATE_REGISTRATION_DATA',
  VALIDATE_REGISTRATION_DATA_PENDING:
    'recodex/users/VALIDATE_REGISTRATION_DATA_PENDING',
  VALIDATE_REGISTRATION_DATA_FULFILLED:
    'recodex/users/VALIDATE_REGISTRATION_DATA_FULFILLED',
  VALIDATE_REGISTRATION_DATA_REJECTED:
    'recodex/users/VALIDATE_REGISTRATION_DATA_REJECTED',
  CREATE_LOCAL_LOGIN: 'recodex/users/CREATE_LOCAL_LOGIN',
  CREATE_LOCAL_LOGIN_PENDING: 'recodex/users/CREATE_LOCAL_LOGIN_PENDING',
  CREATE_LOCAL_LOGIN_FULFILLED: 'recodex/users/CREATE_LOCAL_LOGIN_FULFILLED',
  CREATE_LOCAL_LOGIN_REJECTED: 'recodex/users/CREATE_LOCAL_LOGIN_REJECTED',
  SET_ROLE: 'recodex/users/SET_ROLE',
  SET_ROLE_PENDING: 'recodex/users/SET_ROLE_PENDING',
  SET_ROLE_FULFILLED: 'recodex/users/SET_ROLE_FULFILLED',
  SET_ROLE_REJECTED: 'recodex/users/SET_ROLE_REJECTED',
  SET_IS_ALLOWED: 'recodex/users/SET_IS_ALLOWED',
  SET_IS_ALLOWED_PENDING: 'recodex/users/SET_IS_ALLOWED_PENDING',
  SET_IS_ALLOWED_FULFILLED: 'recodex/users/SET_IS_ALLOWED_FULFILLED',
  SET_IS_ALLOWED_REJECTED: 'recodex/users/SET_IS_ALLOWED_REJECTED'
};

const resourceName = 'users';
var { actions, actionTypes, reduceActions } = factory({ resourceName });

export { actionTypes };

/**
 * Actions
 */

export const fetchManyEndpoint = '/users';

export const loadUserData = actions.pushResource;
export const fetchUser = actions.fetchResource;
export const fetchUserIfNeeded = actions.fetchOneIfNeeded;
export const validateRegistrationData = (email, password) =>
  createApiAction({
    type: additionalActionTypes.VALIDATE_REGISTRATION_DATA,
    endpoint: '/users/validate-registration-data',
    method: 'POST',
    body: { email, password }
  });

export const updateProfile = actions.updateResource;
export const updateSettings = (id, body) =>
  actions.updateResource(id, body, `/users/${id}/settings`);
export const deleteUser = actions.removeResource;

export const fetchSupervisors = groupId =>
  actions.fetchMany({
    endpoint: `/groups/${groupId}/supervisors`
  });

export const fetchStudents = groupId =>
  actions.fetchMany({
    endpoint: `/groups/${groupId}/students`
  });

export const makeLocalLogin = id =>
  createApiAction({
    type: additionalActionTypes.CREATE_LOCAL_LOGIN,
    endpoint: `/users/${id}/create-local`,
    method: 'POST',
    meta: { id }
  });

export const setRole = (id, role) =>
  createApiAction({
    type: additionalActionTypes.SET_ROLE,
    endpoint: `/users/${id}/role`,
    method: 'POST',
    meta: { id, role },
    body: { role }
  });

export const setIsAllowed = (id, isAllowed = true) =>
  createApiAction({
    type: additionalActionTypes.SET_IS_ALLOWED,
    endpoint: `/users/${id}/allowed`,
    method: 'POST',
    meta: { id, isAllowed },
    body: { isAllowed }
  });

/**
 * Reducer
 */
const reducer = handleActions(
  Object.assign({}, reduceActions, {
    [actionTypes.UPDATE_FULFILLED]: (state, { payload, meta: { id } }) =>
      state.setIn(
        ['resources', id, 'data'],
        fromJS(
          payload.user && typeof payload.user === 'object'
            ? payload.user
            : payload
        )
      ),

    [emailVerificationActionTypes.EMAIL_VERIFICATION_FULFILLED]: (
      state,
      { meta: { userId } }
    ) =>
      state.hasIn(['resources', userId])
        ? state.updateIn(
            ['resources', userId, 'data'],
            userData =>
              userData === null ? null : userData.set('isVerified', true)
          )
        : state,

    [groupsActionTypes.JOIN_GROUP_PENDING]: (
      state,
      { meta: { groupId, userId } }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'studentOf'],
        list => list.push(groupId)
      );
    },

    [groupsActionTypes.JOIN_GROUP_REJECTED]: (
      state,
      { meta: { groupId, userId } }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'studentOf'],
        list => list.filter(id => id !== groupId)
      );
    },

    [groupsActionTypes.LEAVE_GROUP_PENDING]: (
      state,
      { meta: { groupId, userId } }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'studentOf'],
        list => list.filter(id => id !== groupId)
      );
    },

    [groupsActionTypes.LEAVE_GROUP_REJECTED]: (
      state,
      { meta: { groupId, userId } }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'studentOf'],
        list => list.push(groupId)
      );
    },

    [groupsActionTypes.MAKE_SUPERVISOR_PENDING]: (
      state,
      { meta: { groupId, userId } }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'supervisorOf'],
        list => list.push(groupId)
      );
    },

    [sisSupervisedCoursesActionTypes.CREATE_FULFILLED]: (
      state,
      { meta: { userId }, payload }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'supervisorOf'],
        list => list.push(payload.id)
      );
    },

    [groupsActionTypes.MAKE_SUPERVISOR_REJECTED]: (
      state,
      { meta: { groupId, userId } }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'supervisorOf'],
        list => list.filter(id => id !== groupId)
      );
    },

    [groupsActionTypes.REMOVE_SUPERVISOR_PENDING]: (
      state,
      { meta: { groupId, userId } }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'supervisorOf'],
        list => list.filter(id => id !== groupId)
      );
    },

    [groupsActionTypes.REMOVE_SUPERVISOR_REJECTED]: (
      state,
      { meta: { groupId, userId } }
    ) => {
      if (!state.getIn(['resources', userId])) {
        return state;
      }

      return state.updateIn(
        ['resources', userId, 'data', 'privateData', 'groups', 'supervisorOf'],
        list => list.push(groupId)
      );
    },

    [additionalActionTypes.CREATE_LOCAL_LOGIN_PENDING]: (
      state,
      { meta: { id } }
    ) => state.setIn(['resources', id, 'data', 'privateData', 'isLocal'], true),

    [additionalActionTypes.CREATE_LOCAL_LOGIN_REJECTED]: (
      state,
      { meta: { id } }
    ) =>
      state.setIn(['resources', id, 'data', 'privateData', 'isLocal'], false),

    [additionalActionTypes.CREATE_LOCAL_LOGIN_FULFILLED]: (
      state,
      { payload, meta: { id } }
    ) => state.setIn(['resources', id, 'data'], fromJS(payload)),

    // Pagination result needs to store entity data here whilst indices are stored in pagination module
    [paginationActionTypes.FETCH_PAGINATED_FULFILLED]: (
      state,
      { payload: { items }, meta: { endpoint } }
    ) =>
      endpoint === 'users'
        ? state.mergeIn(
            ['resources'],
            arrayToObject(
              items,
              obj => obj.id,
              data =>
                createRecord({
                  data,
                  state: resourceStatus.FULFILLED,
                  didInvalidate: false,
                  lastUpdate: Date.now()
                })
            )
          )
        : state,

    [exercisesAuthorsActionTypes.FETCH_FULFILLED]: (state, { payload }) =>
      state.mergeIn(
        ['resources'],
        arrayToObject(
          payload,
          obj => obj.id,
          data =>
            createRecord({
              data,
              state: resourceStatus.FULFILLED,
              didInvalidate: false,
              lastUpdate: Date.now()
            })
        )
      ),

    [additionalActionTypes.SET_ROLE_FULFILLED]: (state, { payload: data }) =>
      data && data.id
        ? state.setIn(
            ['resources', data.id],
            createRecord({
              data,
              state: resourceStatus.FULFILLED,
              didInvalidate: false,
              lastUpdate: Date.now()
            })
          )
        : state,

    [additionalActionTypes.SET_IS_ALLOWED_PENDING]: (state, { meta: { id } }) =>
      state.setIn(['resources', id, 'data', 'isAllowed-pending'], true),

    [additionalActionTypes.SET_IS_ALLOWED_REJECTED]: (
      state,
      { meta: { id } }
    ) => state.setIn(['resources', id, 'data', 'isAllowed-pending'], false),

    [additionalActionTypes.SET_IS_ALLOWED_FULFILLED]: (
      state,
      { payload: data, meta: { id } }
    ) =>
      data && data.id
        ? state.setIn(
            ['resources', data.id],
            createRecord({
              data,
              state: resourceStatus.FULFILLED,
              didInvalidate: false,
              lastUpdate: Date.now()
            })
          )
        : state.setIn(['resources', id, 'data', 'isAllowed-pending'], false)
  }),
  initialState
);

export default reducer;
