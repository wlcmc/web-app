import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { Table } from 'react-bootstrap';
import { FormattedMessage, injectIntl } from 'react-intl';
import { EMPTY_LIST, EMPTY_OBJ, EMPTY_ARRAY } from '../../../../helpers/common';

import {
  isReady,
  isLoading,
  getJsData
} from '../../../../redux/helpers/resourceManager';
import AssignmentTableRow, {
  NoAssignmentTableRow,
  LoadingAssignmentTableRow
} from '../AssignmentTableRow';
import { compareAssignments } from '../../../helpers/assignments';

const fetchAssignmentStatus = (statuses, assignmentId) => {
  const assignStatus =
    statuses && Array.isArray(statuses)
      ? statuses.find(assignStatus => assignStatus.id === assignmentId)
      : null;
  return assignStatus ? assignStatus.status : '';
};

const AssignmentsTable = ({
  assignments = EMPTY_LIST,
  assignmentEnvironmentsSelector = null,
  statuses = EMPTY_ARRAY,
  userId = null,
  stats = EMPTY_OBJ,
  isAdmin = false,
  intl: { locale }
}) =>
  <Table hover>
    {assignments.size > 0 &&
      <thead>
        <tr>
          <th />
          <th>
            <FormattedMessage
              id="app.assignments.name"
              defaultMessage="Assignment name"
            />
          </th>

          {assignmentEnvironmentsSelector &&
            <th>
              <FormattedMessage
                id="generic.runtimesShort"
                defaultMessage="Runtimes/Languages"
              />
            </th>}

          {!isAdmin &&
            Object.keys(stats).length !== 0 &&
            <th>
              <FormattedMessage
                id="app.assignments.points"
                defaultMessage="Points"
              />
            </th>}

          <th>
            <FormattedMessage
              id="app.assignments.deadline"
              defaultMessage="Deadline"
            />
          </th>

          <th>
            <FormattedMessage
              id="app.assignments.secondDeadline"
              defaultMessage="Second deadline"
            />
          </th>

          {isAdmin && <th />}
        </tr>
      </thead>}
    <tbody>
      {assignments.size === 0 && <NoAssignmentTableRow />}

      {assignments.some(isLoading) &&
        <LoadingAssignmentTableRow
          colSpan={5 + (assignmentEnvironmentsSelector ? 1 : 0)}
        />}

      {assignments
        .filter(isReady)
        .map(getJsData)
        .sort(compareAssignments)
        .map(assignment =>
          <AssignmentTableRow
            key={assignment.id}
            item={assignment}
            runtimeEnvironments={
              assignmentEnvironmentsSelector &&
              assignmentEnvironmentsSelector(assignment.id)
            }
            userId={userId}
            status={fetchAssignmentStatus(statuses, assignment.id)}
            locale={locale}
            stats={
              Object.keys(stats).length !== 0
                ? stats.assignments.find(item => item.id === assignment.id)
                : null
            }
            isAdmin={isAdmin}
          />
        )}
    </tbody>
  </Table>;

AssignmentsTable.propTypes = {
  assignments: ImmutablePropTypes.list.isRequired,
  assignmentEnvironmentsSelector: PropTypes.func,
  statuses: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  userId: PropTypes.string,
  stats: PropTypes.object,
  isAdmin: PropTypes.bool,
  intl: PropTypes.shape({ locale: PropTypes.string.isRequired }).isRequired
};

export default injectIntl(AssignmentsTable);
