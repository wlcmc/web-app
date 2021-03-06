import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import {
  FormattedMessage,
  defineMessages,
  intlShape,
  injectIntl
} from 'react-intl';
import { Row, Col, Alert } from 'react-bootstrap';
import { formValueSelector } from 'redux-form';
import moment from 'moment';
import { defaultMemoize } from 'reselect';

import Button from '../../components/widgets/FlatButton';
import Page from '../../components/layout/Page';
import ExerciseDetail from '../../components/Exercises/ExerciseDetail';
import ExerciseGroups from '../../components/Exercises/ExerciseGroups';
import LocalizedTexts from '../../components/helpers/LocalizedTexts';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';
import ReferenceSolutionsTable from '../../components/Exercises/ReferenceSolutionsTable';
import SubmitSolutionContainer from '../../containers/SubmitSolutionContainer';
import Box from '../../components/widgets/Box';
import { SendIcon, DeleteIcon, NeedFixingIcon } from '../../components/icons';
import Confirm from '../../components/forms/Confirm';
import ExerciseButtons from '../../components/Exercises/ExerciseButtons';
import ForkExerciseForm from '../../components/forms/ForkExerciseForm';
import MultiAssignForm from '../../components/forms/MultiAssignForm';

import { isSubmitting } from '../../redux/selectors/submission';
import {
  fetchExerciseIfNeeded,
  forkExercise,
  attachExerciseToGroup,
  detachExerciseFromGroup
} from '../../redux/modules/exercises';
import { fetchRuntimeEnvironments } from '../../redux/modules/runtimeEnvironments';
import { runtimeEnvironmentsSelector } from '../../redux/selectors/runtimeEnvironments';
import {
  fetchReferenceSolutions,
  deleteReferenceSolution
} from '../../redux/modules/referenceSolutions';
import {
  init,
  submitReferenceSolution,
  presubmitReferenceSolution
} from '../../redux/modules/submission';
import { fetchHardwareGroups } from '../../redux/modules/hwGroups';
import {
  create as assignExercise,
  editAssignment
} from '../../redux/modules/assignments';
import {
  exerciseSelector,
  exerciseForkedFromSelector,
  getExerciseAttachingGroupId,
  getExerciseDetachingGroupId
} from '../../redux/selectors/exercises';
import { referenceSolutionsSelector } from '../../redux/selectors/referenceSolutions';

import {
  loggedInUserIdSelector,
  selectedInstanceId
} from '../../redux/selectors/auth';
import { instanceSelector } from '../../redux/selectors/instances';
import {
  notArchivedGroupsSelector,
  groupDataAccessorSelector,
  groupsUserCanAssignToSelector
} from '../../redux/selectors/groups';

import withLinks from '../../helpers/withLinks';
import { getLocalizedName } from '../../helpers/localizedData';
import { hasPermissions } from '../../helpers/common';

const messages = defineMessages({
  groupsBox: {
    id: 'app.exercise.groupsBox',
    defaultMessage: 'Assign to Groups'
  },
  referenceSolutionsBox: {
    id: 'app.exercise.referenceSolutionsBox',
    defaultMessage: 'Reference Solutions'
  }
});

export const FORK_EXERCISE_FORM_INITIAL_VALUES = {
  groupId: ''
};

class Exercise extends Component {
  state = { forkId: null };

  static loadAsync = ({ exerciseId }, dispatch, { userId }) =>
    Promise.all([
      dispatch(fetchExerciseIfNeeded(exerciseId)).then(
        ({ value: data }) =>
          data &&
          data.forkedFrom &&
          dispatch(fetchExerciseIfNeeded(data.forkedFrom))
      ),
      dispatch(fetchRuntimeEnvironments()),
      dispatch(fetchReferenceSolutions(exerciseId)),
      dispatch(fetchHardwareGroups())
      //      dispatch(fetchExercisePipelines(exerciseId)), // TODO - awaiting modification (many-to-many relation with exercises)
    ]);

  componentWillMount() {
    this.props.loadAsync(this.props.userId);
    this.reset();
  }

  componentWillReceiveProps(newProps) {
    if (this.props.params.exerciseId !== newProps.params.exerciseId) {
      newProps.loadAsync(this.props.userId);
      this.reset();
    }
  }

  reset() {
    this.setState({ forkId: Math.random().toString() });
  }

  multiAssignFormInitialValues = defaultMemoize(
    (visibleGroups, runtimeEnvironments) => {
      const groups = {};
      visibleGroups.forEach(g => {
        groups[`id${g.id}`] = false;
      });

      return {
        groups,
        submissionsCountLimit: '50',
        firstDeadline: moment().add(2, 'weeks').endOf('day'),
        secondDeadline: '',
        allowSecondDeadline: false,
        maxPointsBeforeFirstDeadline: '10',
        maxPointsBeforeSecondDeadline: '',
        canViewLimitRatios: true,
        pointsPercentualThreshold: '0',
        isBonus: false,
        runtimeEnvironments,
        sendNotification: true,
        enabledRuntime: runtimeEnvironments.reduce((enabled, { id }) => {
          enabled[id] = true;
          return enabled;
        }, {})
      };
    }
  );

  assignExercise = formData => {
    const { assignExercise, editAssignment } = this.props;

    const groups =
      formData && formData.groups
        ? Object.keys(formData.groups).filter(key => formData.groups[key])
        : [];

    const disabledRuntimeEnvironmentIds = formData.enabledRuntime
      ? Object.keys(formData.enabledRuntime).filter(
          key => formData.enabledRuntime[key] === false
        )
      : [];

    let actions = [];

    for (const groupIdMangled of groups) {
      const groupId = groupIdMangled.replace(/^id/, '');
      const groupPromise = assignExercise(
        groupId
      ).then(({ value: assigment }) => {
        let assignmentData = Object.assign({}, assigment, formData, {
          firstDeadline: moment(formData.firstDeadline).unix(),
          secondDeadline: moment(formData.secondDeadline).unix(),
          submissionsCountLimit: Number(formData.submissionsCountLimit),
          pointsPercentualThreshold: Number(formData.pointsPercentualThreshold),
          maxPointsBeforeFirstDeadline: Number(
            formData.maxPointsBeforeFirstDeadline
          ),
          maxPointsBeforeSecondDeadline: Number(
            formData.maxPointsBeforeSecondDeadline
          ),
          isPublic: true,
          sendNotification: formData.sendNotification,
          disabledRuntimeEnvironmentIds
        });
        if (!assignmentData.allowSecondDeadline) {
          delete assignmentData.secondDeadline;
          delete assignmentData.maxPointsBeforeSecondDeadline;
        }
        delete assignmentData.groups;
        delete assignmentData.enabledRuntime;

        return editAssignment(assigment.id, assignmentData);
      });
      actions.push(groupPromise);
    }

    return Promise.all(actions);
  };

  render() {
    const {
      userId,
      instance,
      exercise,
      forkedFrom,
      runtimeEnvironments,
      submitting,
      referenceSolutions,
      intl: { formatMessage, locale },
      initCreateReferenceSolution,
      deleteReferenceSolution,
      push,
      groups,
      assignableGroups,
      groupsAccessor,
      forkExercise,
      firstDeadline,
      allowSecondDeadline,
      attachingGroupId,
      detachingGroupId,
      attachExerciseToGroup,
      detachExerciseFromGroup,
      links: { EXERCISES_URI, EXERCISE_REFERENCE_SOLUTION_URI_FACTORY }
    } = this.props;

    const { forkId } = this.state;

    return (
      <Page
        title={exercise => getLocalizedName(exercise, locale)}
        resource={exercise}
        description={
          <FormattedMessage
            id="app.exercise.overview"
            defaultMessage="Exercise overview"
          />
        }
        breadcrumbs={[
          {
            text: (
              <FormattedMessage
                id="app.exercises.title"
                defaultMessage="Exercises List"
              />
            ),
            iconName: 'puzzle-piece',
            link: EXERCISES_URI
          },
          {
            text: (
              <FormattedMessage
                id="app.exercise.overview"
                defaultMessage="Exercise overview"
              />
            ),
            iconName: ['far', 'lightbulb']
          }
        ]}
      >
        {exercise =>
          <div>
            {exercise.isBroken &&
              <Row>
                <Col sm={12}>
                  <div className="callout callout-warning">
                    <h4>
                      <NeedFixingIcon gapRight />
                      <FormattedMessage
                        id="app.exercise.isBroken"
                        defaultMessage="Exercise configuration is incorrect and needs fixing"
                      />
                    </h4>
                    {exercise.validationError}
                  </div>
                </Col>
              </Row>}
            <Row>
              <Col sm={12}>
                <ExerciseButtons {...exercise} />
              </Col>
            </Row>
            {hasPermissions(exercise, 'fork') &&
              <Row>
                <Col sm={12} className="em-margin-bottom">
                  <ForkExerciseForm
                    exerciseId={exercise.id}
                    groups={groups}
                    forkId={forkId}
                    onSubmit={formData => forkExercise(forkId, formData)}
                    groupsAccessor={groupsAccessor}
                    initialValues={FORK_EXERCISE_FORM_INITIAL_VALUES}
                  />
                </Col>
              </Row>}
            <Row>
              <Col lg={6}>
                <div>
                  {exercise.localizedTexts.length > 0 &&
                    <LocalizedTexts locales={exercise.localizedTexts} />}
                </div>
                {!exercise.isBroken &&
                  !exercise.isLocked &&
                  <Box
                    title={formatMessage(messages.groupsBox)}
                    description={
                      <Alert bsStyle="info">
                        <FormattedMessage
                          id="app.exercise.assignToGroup"
                          defaultMessage="You can assign this exercise to multiple groups you supervise. The exercise can also be assigned from within the groups individually. Please note that an exercise may be assigned multiple times and this form does not track existing assignments."
                        />
                      </Alert>
                    }
                    unlimitedHeight
                  >
                    <ResourceRenderer
                      resource={assignableGroups.toArray()}
                      returnAsArray
                    >
                      {assignableGroups =>
                        <MultiAssignForm
                          initialValues={this.multiAssignFormInitialValues(
                            assignableGroups,
                            exercise.runtimeEnvironments
                          )}
                          groups={assignableGroups}
                          userId={userId}
                          runtimeEnvironments={exercise.runtimeEnvironments}
                          onSubmit={this.assignExercise}
                          firstDeadline={firstDeadline}
                          allowSecondDeadline={allowSecondDeadline}
                          groupsAccessor={groupsAccessor}
                        />}
                    </ResourceRenderer>
                  </Box>}
              </Col>
              <Col lg={6}>
                <ExerciseDetail
                  {...exercise}
                  forkedFrom={forkedFrom}
                  locale={locale}
                />

                <ResourceRenderer resource={instance}>
                  {instance =>
                    <ExerciseGroups
                      showButtons={hasPermissions(exercise, 'update')}
                      groupsIds={exercise.groupsIds}
                      rootGroupId={instance.rootGroupId}
                      attachingGroupId={attachingGroupId}
                      detachingGroupId={detachingGroupId}
                      attachExerciseToGroup={attachExerciseToGroup}
                      detachExerciseFromGroup={detachExerciseFromGroup}
                      groups={groups}
                    />}
                </ResourceRenderer>

                <ResourceRenderer
                  resource={runtimeEnvironments.toArray()}
                  returnAsArray={true}
                >
                  {runtimes =>
                    <Box
                      title={formatMessage(messages.referenceSolutionsBox)}
                      noPadding
                      footer={
                        hasPermissions(exercise, 'addReferenceSolution') &&
                        <div className="text-center">
                          <Button
                            bsStyle={exercise.isBroken ? 'default' : 'success'}
                            onClick={() => initCreateReferenceSolution(userId)}
                            disabled={exercise.isBroken}
                          >
                            {exercise.isBroken
                              ? <FormattedMessage
                                  id="app.exercise.isBrokenShort"
                                  defaultMessage="Exercise is broken..."
                                />
                              : <FormattedMessage
                                  id="app.exercise.submitReferenceSoution"
                                  defaultMessage="Submit New Reference Solution"
                                />}
                          </Button>
                        </div>
                      }
                    >
                      <div>
                        <ResourceRenderer
                          resource={referenceSolutions.toArray()}
                          returnAsArray
                        >
                          {referenceSolutions =>
                            referenceSolutions.length > 0
                              ? <ReferenceSolutionsTable
                                  referenceSolutions={referenceSolutions}
                                  runtimeEnvironments={runtimes}
                                  renderButtons={(
                                    solutionId,
                                    permissionHints
                                  ) =>
                                    <div>
                                      <Button
                                        bsSize="xs"
                                        onClick={() =>
                                          push(
                                            EXERCISE_REFERENCE_SOLUTION_URI_FACTORY(
                                              exercise.id,
                                              solutionId
                                            )
                                          )}
                                      >
                                        <SendIcon gapRight />
                                        <FormattedMessage
                                          id="generic.detail"
                                          defaultMessage="Detail"
                                        />
                                      </Button>
                                      {permissionHints &&
                                        permissionHints.delete !== false &&
                                        <Confirm
                                          id={solutionId}
                                          onConfirmed={() =>
                                            deleteReferenceSolution(solutionId)}
                                          question={
                                            <FormattedMessage
                                              id="app.exercise.referenceSolution.deleteConfirm"
                                              defaultMessage="Are you sure you want to delete the reference solution? This cannot be undone."
                                            />
                                          }
                                        >
                                          <Button
                                            bsSize="xs"
                                            className="btn-flat"
                                            bsStyle="danger"
                                          >
                                            <DeleteIcon gapRight />
                                            <FormattedMessage
                                              id="generic.delete"
                                              defaultMessage="Delete"
                                            />
                                          </Button>
                                        </Confirm>}
                                    </div>}
                                />
                              : <p className="text-center em-padding text-muted">
                                  <FormattedMessage
                                    id="app.exercise.noReferenceSolutions"
                                    defaultMessage="There are no reference solutions for this exercise yet."
                                  />
                                </p>}
                        </ResourceRenderer>
                        <SubmitSolutionContainer
                          userId={userId}
                          id={exercise.id}
                          onSubmit={submitReferenceSolution}
                          presubmitValidation={presubmitReferenceSolution}
                          onReset={init}
                          isOpen={submitting}
                          isReferenceSolution={true}
                        />
                      </div>
                    </Box>}
                </ResourceRenderer>
              </Col>
            </Row>
          </div>}
      </Page>
    );
  }
}

Exercise.contextTypes = {
  links: PropTypes.object
};

Exercise.propTypes = {
  userId: PropTypes.string.isRequired,
  instance: ImmutablePropTypes.map,
  params: PropTypes.shape({
    exerciseId: PropTypes.string.isRequired
  }).isRequired,
  loadAsync: PropTypes.func.isRequired,
  assignExercise: PropTypes.func.isRequired,
  editAssignment: PropTypes.func.isRequired,
  push: PropTypes.func.isRequired,
  exercise: ImmutablePropTypes.map,
  forkedFrom: ImmutablePropTypes.map,
  runtimeEnvironments: ImmutablePropTypes.map,
  referenceSolutions: ImmutablePropTypes.map,
  intl: intlShape.isRequired,
  submitting: PropTypes.bool,
  initCreateReferenceSolution: PropTypes.func.isRequired,
  links: PropTypes.object,
  deleteReferenceSolution: PropTypes.func.isRequired,
  forkExercise: PropTypes.func.isRequired,
  groups: ImmutablePropTypes.map,
  assignableGroups: ImmutablePropTypes.map,
  groupsAccessor: PropTypes.func.isRequired,
  firstDeadline: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.object
  ]),
  allowSecondDeadline: PropTypes.bool,
  attachingGroupId: PropTypes.string,
  detachingGroupId: PropTypes.string,
  attachExerciseToGroup: PropTypes.func.isRequired,
  detachExerciseFromGroup: PropTypes.func.isRequired
};

const editMultiAssignFormSelector = formValueSelector('multiAssign');

export default withLinks(
  connect(
    (state, { params: { exerciseId } }) => {
      const userId = loggedInUserIdSelector(state);
      const instanceId = selectedInstanceId(state);
      return {
        userId,
        instance: instanceSelector(state, instanceId),
        exercise: exerciseSelector(exerciseId)(state),
        forkedFrom: exerciseForkedFromSelector(exerciseId)(state),
        runtimeEnvironments: runtimeEnvironmentsSelector(state),
        submitting: isSubmitting(state),
        referenceSolutions: referenceSolutionsSelector(exerciseId)(state),
        groups: notArchivedGroupsSelector(state),
        assignableGroups: groupsUserCanAssignToSelector(state),
        groupsAccessor: groupDataAccessorSelector(state),
        firstDeadline: editMultiAssignFormSelector(state, 'firstDeadline'),
        allowSecondDeadline: editMultiAssignFormSelector(
          state,
          'allowSecondDeadline'
        ),
        attachingGroupId: getExerciseAttachingGroupId(exerciseId)(state),
        detachingGroupId: getExerciseDetachingGroupId(exerciseId)(state)
      };
    },
    (dispatch, { params: { exerciseId } }) => ({
      loadAsync: userId =>
        Exercise.loadAsync({ exerciseId }, dispatch, { userId }),
      assignExercise: groupId => dispatch(assignExercise(groupId, exerciseId)),
      editAssignment: (id, body) => dispatch(editAssignment(id, body)),
      push: url => dispatch(push(url)),
      initCreateReferenceSolution: userId => dispatch(init(userId, exerciseId)),
      deleteReferenceSolution: solutionId =>
        dispatch(deleteReferenceSolution(solutionId)),
      forkExercise: (forkId, data) =>
        dispatch(forkExercise(exerciseId, forkId, data)),
      attachExerciseToGroup: groupId =>
        dispatch(attachExerciseToGroup(exerciseId, groupId)),
      detachExerciseFromGroup: groupId =>
        dispatch(detachExerciseFromGroup(exerciseId, groupId))
    })
  )(injectIntl(Exercise))
);
