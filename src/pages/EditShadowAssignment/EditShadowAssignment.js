import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { FormattedMessage } from 'react-intl';
import { Grid, Col, Row } from 'react-bootstrap';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { reset, formValueSelector, SubmissionError } from 'redux-form';
import moment from 'moment';
import { LinkContainer } from 'react-router-bootstrap';
import { defaultMemoize } from 'reselect';

import Button from '../../components/widgets/FlatButton';
import Page from '../../components/layout/Page';
import EditShadowAssignmentForm from '../../components/forms/EditShadowAssignmentForm';
import DeleteAssignmentButtonContainer from '../../containers/DeleteAssignmentButtonContainer';
import Box from '../../components/widgets/Box';
import HierarchyLineContainer from '../../containers/HierarchyLineContainer';
import { ResultsIcon } from '../../components/icons';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';

import {
  fetchShadowAssignment,
  editShadowAssignment
} from '../../redux/modules/shadowAssignments';
import { getShadowAssignment } from '../../redux/selectors/shadowAssignments';
import { isReady, getJsData } from '../../redux/helpers/resourceManager';

import withLinks from '../../helpers/withLinks';

class EditShadowAssignment extends Component {
  componentWillMount = () => this.props.loadAsync();
  componentWillReceiveProps = nextProps => {
    if (this.props.params.assignmentId !== nextProps.params.assignmentId) {
      nextProps.reset();
      nextProps.loadAsync();
    }

    if (isReady(nextProps.shadowAssignment)) {
      this.groupId = getJsData(nextProps.shadowAssignment).groupId;
    }
  };

  static loadAsync = ({ assignmentId }, dispatch) =>
    dispatch(fetchShadowAssignment(assignmentId));

  getInitialValues = defaultMemoize(({ ...rest }) => ({
    sendNotification: true,
    ...rest
  }));

  editAssignmentSubmitHandler = formData => {
    /*
    const { shadowAssignment, editAssignment, validateAssignment } = this.props;
    const version = shadowAssignment.getIn(['data', 'version']);

    // validate shadowAssignment version
    return validateAssignment(version)
      .then(res => res.value)
      .then(({ versionIsUpToDate }) => {
        if (versionIsUpToDate === false) {
          throw SubmissionError({
            _error: (
              <FormattedMessage
                id="app.editShadowAssignmentForm.validation.versionDiffers"
                defaultMessage="Somebody has changed the shadow assignment while you have been editing it. Please reload the page and apply your changes once more."
              />
            )
          });
        }
      })
      .then(() => {
        // prepare the data and submit them
        const disabledRuntimeEnvironmentIds = formData.enabledRuntime
          ? Object.keys(formData.enabledRuntime).filter(
              key => formData.enabledRuntime[key] === false
            )
          : [];

        const modifiedData = {
          ...formData,
          disabledRuntimeEnvironmentIds
        };
        delete modifiedData.enabledRuntime;

        return editAssignment(version, modifiedData);
      });
      */
  };

  render() {
    const {
      shadowAssignment,
      localizedTexts,
      isPublic,
      params: { assignmentId },
      push,
      links: { SHADOW_ASSIGNMENT_DETAIL_URI_FACTORY, GROUP_DETAIL_URI_FACTORY }
    } = this.props;

    return (
      <Page
        resource={shadowAssignment}
        title={
          <FormattedMessage
            id="app.editShadowAssignment.title"
            defaultMessage="Edit Shadow Assignment"
          />
        }
        description={
          <FormattedMessage
            id="app.editShadowAssignment.description"
            defaultMessage="Change shadow assignment settings"
          />
        }
        breadcrumbs={[
          {
            text: <FormattedMessage id="app.shadowAssignment.title" />,
            iconName: 'user-secret',
            link: SHADOW_ASSIGNMENT_DETAIL_URI_FACTORY(assignmentId)
          },
          {
            text: <FormattedMessage id="app.editShadowAssignment.title" />,
            iconName: ['far', 'edit']
          }
        ]}
      >
        {shadowAssignment =>
          shadowAssignment &&
          <Grid fluid>
            <Row>
              <Col xs={12}>
                <HierarchyLineContainer groupId={shadowAssignment.groupId} />
              </Col>
            </Row>

            <EditShadowAssignmentForm
              initialValues={
                shadowAssignment ? this.getInitialValues(shadowAssignment) : {}
              }
              onSubmit={this.editAssignmentSubmitHandler}
              beingPublished={!shadowAssignment.isPublic && isPublic}
            />
            {shadowAssignment.permissionHints.remove &&
              <Box
                type="danger"
                title={
                  <FormattedMessage
                    id="app.editShadowAssignment.deleteAssignment"
                    defaultMessage="Delete the shadow assignment"
                  />
                }
              >
                <div>
                  <p>
                    <FormattedMessage
                      id="app.editShadowAssignment.deleteAssignmentWarning"
                      defaultMessage="Deleting shadow assignment will remove all student points as well."
                    />
                  </p>
                  <p className="text-center">
                    {/*
                    <DeleteAssignmentButtonContainer
                      id={assignmentId}
                      onDeleted={() =>
                        push(GROUP_DETAIL_URI_FACTORY(this.groupId))}
                    />
                      */}
                  </p>
                </div>
              </Box>}
          </Grid>}
      </Page>
    );
  }
}

EditShadowAssignment.propTypes = {
  loadAsync: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  push: PropTypes.func.isRequired,
  params: PropTypes.shape({
    assignmentId: PropTypes.string.isRequired
  }).isRequired,
  shadowAssignment: ImmutablePropTypes.map,
  editShadowAssignment: PropTypes.func.isRequired,
  localizedTexts: PropTypes.array,
  isPublic: PropTypes.bool,
  //validateAssignment: PropTypes.func.isRequired,
  links: PropTypes.object
};

const editAssignmentFormSelector = formValueSelector('editShadowAssignment');

export default connect(
  (state, { params: { assignmentId } }) => {
    const shadowAssignment = getShadowAssignment(state)(assignmentId);
    return {
      shadowAssignment,
      localizedTexts: editAssignmentFormSelector(state, 'localizedTexts'),
      isPublic: editAssignmentFormSelector(state, 'isPublic')
    };
  },
  (dispatch, { params: { assignmentId } }) => ({
    push: url => dispatch(push(url)),
    reset: () => dispatch(reset('editShadowAssignment')),
    loadAsync: () => EditShadowAssignment.loadAsync({ assignmentId }, dispatch),
    editShadowAssignment: (version, data) => {
      // convert deadline times to timestamps
      const processedData = Object.assign({}, data, {
        version
      });
      return dispatch(editShadowAssignment(assignmentId, processedData));
    }
    //validateAssignment: version =>
    //  dispatch(validateAssignment(assignmentId, version))
  })
)(withLinks(EditShadowAssignment));
