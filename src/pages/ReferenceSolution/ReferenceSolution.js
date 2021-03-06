import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  FormattedMessage,
  defineMessages,
  intlShape,
  injectIntl
} from 'react-intl';
import ImmutablePropTypes from 'react-immutable-proptypes';

import FetchManyResourceRenderer from '../../components/helpers/FetchManyResourceRenderer';
import withLinks from '../../helpers/withLinks';
import Page from '../../components/layout/Page';

import {
  fetchReferenceSolutionIfNeeded,
  fetchReferenceSolution
} from '../../redux/modules/referenceSolutions';
import { fetchExerciseIfNeeded } from '../../redux/modules/exercises';

import { getReferenceSolution } from '../../redux/selectors/referenceSolutions';
import { getExercise } from '../../redux/selectors/exercises';
import ReferenceSolutionDetail from '../../components/ReferenceSolutions/ReferenceSolutionDetail';
import {
  fetchReferenceSolutionEvaluationsForSolution,
  deleteReferenceSolutionEvaluation
} from '../../redux/modules/referenceSolutionEvaluations';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';
import {
  evaluationsForReferenceSolutionSelector,
  fetchManyStatus
} from '../../redux/selectors/referenceSolutionEvaluations';
import ResubmitReferenceSolutionContainer from '../../containers/ResubmitReferenceSolutionContainer';
import { hasPermissions } from '../../helpers/common';

const messages = defineMessages({
  title: {
    id: 'app.exercise.referenceSolutionTitle',
    defaultMessage: 'Reference solution overview'
  }
});

class ReferenceSolution extends Component {
  static loadAsync = ({ exerciseId, referenceSolutionId }, dispatch) =>
    Promise.all([
      dispatch(fetchReferenceSolutionIfNeeded(referenceSolutionId)),
      dispatch(fetchExerciseIfNeeded(exerciseId)),
      dispatch(
        fetchReferenceSolutionEvaluationsForSolution(referenceSolutionId)
      )
    ]);

  componentWillMount() {
    this.props.loadAsync();
  }

  componentWillReceiveProps(newProps) {
    if (
      this.props.params.referenceSolutionId !==
      newProps.params.referenceSolutionId
    ) {
      newProps.loadAsync();
    }
  }

  render() {
    const {
      referenceSolution,
      exercise,
      params: { exerciseId },
      fetchStatus,
      evaluations,
      refreshSolutionEvaluations,
      deleteEvaluation,
      intl: { formatMessage },
      links: { EXERCISES_URI, EXERCISE_URI_FACTORY }
    } = this.props;

    return (
      <Page
        title={formatMessage(messages.title)}
        resource={referenceSolution}
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
            iconName: ['far', 'lightbulb'],
            link: EXERCISE_URI_FACTORY(exerciseId)
          },
          {
            text: (
              <FormattedMessage
                id="app.exercise.referenceSolutionDetail"
                defaultMessage="Reference solution detail"
              />
            ),
            iconName: ['far', 'gem']
          }
        ]}
      >
        {referenceSolution =>
          <ResourceRenderer resource={exercise}>
            {exercise =>
              <React.Fragment>
                {hasPermissions(referenceSolution, 'evaluate') &&
                  <React.Fragment>
                    {exercise.isBroken
                      ? <p className="callout callout-warning">
                          <FormattedMessage
                            id="app.referenceSolution.exerciseBroken"
                            defaultMessage="The exercise is broken. This reference solution may not be resubmitted at the moment."
                          />
                        </p>
                      : <p>
                          <ResubmitReferenceSolutionContainer
                            id={referenceSolution.id}
                            isDebug={false}
                          />
                          <ResubmitReferenceSolutionContainer
                            id={referenceSolution.id}
                            isDebug={true}
                          />
                        </p>}
                  </React.Fragment>}

                <FetchManyResourceRenderer fetchManyStatus={fetchStatus}>
                  {() =>
                    <ReferenceSolutionDetail
                      solution={referenceSolution}
                      evaluations={evaluations}
                      exercise={exercise}
                      deleteEvaluation={deleteEvaluation}
                      refreshSolutionEvaluations={refreshSolutionEvaluations}
                    />}
                </FetchManyResourceRenderer>
              </React.Fragment>}
          </ResourceRenderer>}
      </Page>
    );
  }
}

ReferenceSolution.propTypes = {
  params: PropTypes.shape({
    exerciseId: PropTypes.string.isRequired,
    referenceSolutionId: PropTypes.string.isRequired
  }).isRequired,
  loadAsync: PropTypes.func.isRequired,
  referenceSolution: ImmutablePropTypes.map,
  exercise: ImmutablePropTypes.map,
  refreshSolutionEvaluations: PropTypes.func,
  deleteEvaluation: PropTypes.func.isRequired,
  fetchStatus: PropTypes.string,
  evaluations: ImmutablePropTypes.map,
  intl: intlShape.isRequired,
  links: PropTypes.object.isRequired
};

export default withLinks(
  injectIntl(
    connect(
      (state, { params: { exerciseId, referenceSolutionId } }) => ({
        referenceSolution: getReferenceSolution(referenceSolutionId)(state),
        exercise: getExercise(exerciseId)(state),
        evaluations: evaluationsForReferenceSolutionSelector(
          referenceSolutionId
        )(state),
        fetchStatus: fetchManyStatus(referenceSolutionId)(state)
      }),
      (dispatch, { params }) => ({
        loadAsync: () => ReferenceSolution.loadAsync(params, dispatch),
        refreshSolutionEvaluations: () => {
          dispatch(fetchReferenceSolution(params.referenceSolutionId));
          dispatch(
            fetchReferenceSolutionEvaluationsForSolution(
              params.referenceSolutionId
            )
          );
        },
        deleteEvaluation: evaluationId =>
          dispatch(
            deleteReferenceSolutionEvaluation(
              params.referenceSolutionId,
              evaluationId
            )
          )
      })
    )(ReferenceSolution)
  )
);
