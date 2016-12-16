import React, { PropTypes } from 'react';
import { FormattedMessage, FormattedNumber, FormattedTime, FormattedDate } from 'react-intl';
import { Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import Box from '../../AdminLTE/Box';
import DifficultyIcon from '../DifficultyIcon';
import { MaybeSucceededIcon } from '../../Icons';

import UsersNameContainer from '../../../containers/UsersNameContainer';

const ExerciseDetail = ({
  id,
  name,
  authorId,
  description = '',
  difficulty,
  createdAt,
  updatedAt,
  version,
  localizedTexts,
  solutionRuntimeConfigs
}) => (
  <Box title={name} noPadding>
    <Table>
      <tbody>
        <tr>
          <th><FormattedMessage id='app.exercise.author' defaultMessage='Author:' /></th>
          <td><UsersNameContainer userId={authorId} /></td>
        </tr>
        <tr>
          <th><FormattedMessage id='app.exercise.difficulty' defaultMessage='Difficulty:' /></th>
          <td><DifficultyIcon difficulty={difficulty} /></td>
        </tr>
        <tr>
          <th><FormattedMessage id='app.exercise.description' defaultMessage="Author's description:" /></th>
          <td><ReactMarkdown source={description} /></td>
        </tr>
        <tr>
          <th><FormattedMessage id='app.exercise.createdAt' defaultMessage='Created at:' /></th>
          <td><FormattedDate value={createdAt * 1000} /> <FormattedTime value={createdAt * 1000} /></td>
        </tr>
        <tr>
          <th><FormattedMessage id='app.exercise.updatedAt' defaultMessage='Last updateded at:' /></th>
          <td><FormattedDate value={updatedAt * 1000} /> <FormattedTime value={updatedAt * 1000} /></td>
        </tr>
        <tr>
          <th><FormattedMessage id='app.exercise.version' defaultMessage='Version:' /></th>
          <td><FormattedNumber value={version} /></td>
        </tr>
        <tr>
          <th><FormattedMessage id='app.exercise.runtimes' defaultMessage='Supported runtime environments:' /></th>
          <td>
            {solutionRuntimeConfigs.map(({ id, name, isValid }) => (
              <p key={id}>
                <OverlayTrigger
                  placement='left'
                  overlay={(
                    <Tooltip id={id}>
                      {isValid
                        ? <FormattedMessage id='app.exercise.runtimes.isValid' defaultMessage='Configuration is valid' />
                        : <FormattedMessage id='app.exercise.runtimes.isNotValid' defaultMessage='Configuration is not valid' />}
                    </Tooltip>
                  )}>
                  <span><MaybeSucceededIcon success={isValid} />&nbsp;{name}</span>
                </OverlayTrigger>
              </p>
            ))}
          </td>
        </tr>
      </tbody>
    </Table>
  </Box>
);

ExerciseDetail.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  authorId: PropTypes.string.isRequired,
  difficulty: PropTypes.string.isRequired,
  description: PropTypes.string,
  createdAt: PropTypes.number.isRequired,
  updatedAt: PropTypes.number.isRequired,
  version: PropTypes.number.isRequired,
  localizedTexts: PropTypes.array.isRequired,
  solutionRuntimeConfigs: PropTypes.array.isRequired
};

export default ExerciseDetail;
