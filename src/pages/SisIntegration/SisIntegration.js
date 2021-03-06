import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Row, Col, Button } from 'react-bootstrap';
import moment from 'moment';

import PageContent from '../../components/layout/PageContent';
import FetchManyResourceRenderer from '../../components/helpers/FetchManyResourceRenderer';
import SisIntegrationContainer from '../../containers/SisIntegrationContainer';
import SisSupervisorGroupsContainer from '../../containers/SisSupervisorGroupsContainer';
import AddSisTermForm from '../../components/forms/AddSisTermForm/AddSisTermForm';
import TermsList from '../../components/SisIntegration/TermsList/TermsList';
import Confirm from '../../components/forms/Confirm';
import { EditIcon, DeleteIcon } from '../../components/icons';
import EditTerm from '../../components/SisIntegration/EditTerm';
import Box from '../../components/widgets/Box/Box';
import ResourceRenderer from '../../components/helpers/ResourceRenderer';

import {
  fetchAllTerms,
  create,
  deleteTerm,
  editTerm
} from '../../redux/modules/sisTerms';
import { loggedInUserIdSelector } from '../../redux/selectors/auth';
import { getRole } from '../../redux/selectors/users';
import {
  fetchManyStatus,
  readySisTermsSelector
} from '../../redux/selectors/sisTerms';
import { notArchivedGroupsSelector } from '../../redux/selectors/groups';
import { loggedInSupervisorOfSelector } from '../../redux/selectors/usersGroups';

import {
  isStudentRole,
  isSupervisorRole,
  isSuperadminRole
} from '../../components/helpers/usersRoles';

class SisIntegration extends Component {
  state = { openEdit: null };

  static loadAsync = (params, dispatch) =>
    Promise.all([dispatch(fetchAllTerms)]);

  componentWillMount() {
    const { loadAsync, role } = this.props;
    isSuperadminRole(role) && loadAsync();
  }

  componentWillReceiveProps(newProps) {
    if (newProps.role !== this.props.role && isSuperadminRole(newProps.role)) {
      newProps.loadAsync();
    }
  }

  render() {
    const {
      role,
      fetchStatus,
      supervisorOfGroups,
      allGroups,
      createNewTerm,
      deleteTerm,
      editTerm,
      sisTerms
    } = this.props;

    return (
      <PageContent
        title={
          <FormattedMessage
            id="app.sisIntegration.title"
            defaultMessage="UK SIS Integration"
          />
        }
        description={
          <FormattedMessage
            id="app.sisIntegration.description"
            defaultMessage="Integration with Charles University student information system"
          />
        }
        breadcrumbs={[
          {
            text: (
              <FormattedMessage
                id="app.sisIntegration.title"
                defaultMessage="UK SIS Integration"
              />
            ),
            iconName: 'id-badge'
          }
        ]}
      >
        <React.Fragment>
          {isStudentRole(role) &&
            <Row>
              <Col lg={12}>
                <SisIntegrationContainer />
              </Col>
            </Row>}

          {isSupervisorRole(role) &&
            <Row>
              <Col lg={12}>
                <ResourceRenderer
                  resource={
                    isSuperadminRole(role)
                      ? allGroups.toArray()
                      : supervisorOfGroups.toArray()
                  }
                  returnAsArray={true}
                >
                  {groups => <SisSupervisorGroupsContainer groups={groups} />}
                </ResourceRenderer>
              </Col>
            </Row>}

          {isSuperadminRole(role) &&
            <Row>
              <Col lg={8}>
                <FetchManyResourceRenderer fetchManyStatus={fetchStatus}>
                  {() =>
                    <Box
                      title={
                        <FormattedMessage
                          id="app.sisIntegration.list"
                          defaultMessage="SIS Terms"
                        />
                      }
                      noPadding
                      unlimitedHeight
                    >
                      <TermsList
                        terms={sisTerms}
                        createActions={(id, data) =>
                          <div>
                            <Button
                              bsSize="xs"
                              className="btn-flat"
                              bsStyle="warning"
                              onClick={() => this.setState({ openEdit: id })}
                            >
                              <EditIcon gapRight />
                              <FormattedMessage
                                id="generic.edit"
                                defaultMessage="Edit"
                              />
                            </Button>
                            <Confirm
                              id={id}
                              onConfirmed={() => deleteTerm(id)}
                              question={
                                <FormattedMessage
                                  id="app.sisIntegration.deleteConfirm"
                                  defaultMessage="Are you sure you want to delete the SIS term?"
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
                            </Confirm>
                            <EditTerm
                              form={id}
                              isOpen={this.state.openEdit === id}
                              onClose={() => this.setState({ openEdit: null })}
                              onSubmit={data =>
                                editTerm(this.state.openEdit, data).then(() =>
                                  this.setState({ openEdit: null })
                                )}
                              initialValues={{
                                beginning: data.beginning * 1000,
                                end: data.end * 1000,
                                advertiseUntil: data.advertiseUntil * 1000
                              }}
                            />
                          </div>}
                      />
                    </Box>}
                </FetchManyResourceRenderer>
              </Col>
              <Col lg={4}>
                <AddSisTermForm onSubmit={createNewTerm} />
              </Col>
            </Row>}
        </React.Fragment>
      </PageContent>
    );
  }
}

SisIntegration.propTypes = {
  role: PropTypes.string,
  fetchStatus: PropTypes.string,
  sisTerms: PropTypes.array.isRequired,
  supervisorOfGroups: ImmutablePropTypes.map,
  allGroups: ImmutablePropTypes.map,
  loadAsync: PropTypes.func.isRequired,
  createNewTerm: PropTypes.func,
  deleteTerm: PropTypes.func,
  editTerm: PropTypes.func
};

const mapStateToProps = state => {
  const userId = loggedInUserIdSelector(state);
  return {
    role: getRole(userId)(state),
    fetchStatus: fetchManyStatus(state),
    sisTerms: readySisTermsSelector(state),
    supervisorOfGroups: loggedInSupervisorOfSelector(state),
    allGroups: notArchivedGroupsSelector(state)
  };
};

const mapDispatchToProps = (dispatch, { params }) => ({
  loadAsync: () => SisIntegration.loadAsync(params, dispatch),
  createNewTerm: data => dispatch(create(data)),
  deleteTerm: id => dispatch(deleteTerm(id)),
  editTerm: (id, data) => {
    // convert deadline times to timestamps
    const processedData = Object.assign({}, data, {
      beginning: moment(data.beginning).unix(),
      end: moment(data.end).unix(),
      advertiseUntil: moment(data.advertiseUntil).unix()
    });
    return dispatch(editTerm(id, processedData));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(SisIntegration);
