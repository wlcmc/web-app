import React, { PropTypes } from 'react';
import { canUseDOM } from 'exenv';
import { reduxForm, Field, FieldArray } from 'redux-form';
import { injectIntl, intlShape, FormattedMessage, defineMessages } from 'react-intl';
import { Row, Col, Alert } from 'react-bootstrap';

import FormBox from '../../AdminLTE/FormBox';
import {
  TextField,
  SelectField,
  MarkdownTextAreaField
} from '../Fields';
import SubmitButton from '../SubmitButton';
import LocalizedAssignmentsFormField from '../LocalizedAssignmentsFormField';

if (canUseDOM) {
  require('codemirror/mode/yaml/yaml');
}

const messages = defineMessages({
  easy: {
    id: 'app.editExerciseForm.easy',
    defaultMessage: 'Easy'
  },
  medium: {
    id: 'app.editExerciseForm.medium',
    defaultMessage: 'Medium'
  },
  hard: {
    id: 'app.editExerciseForm.hard',
    defaultMessage: 'Hard'
  }
});

const EditExerciseForm = ({
  initialValues: exercise,
  submitting,
  handleSubmit,
  submitFailed: hasFailed,
  submitSucceeded: hasSucceeded,
  invalid,
  formValues: {
    localizedAssignments
  } = {},
  intl: { formatMessage }
}) => (
  <Row>
    <Col lg={6}>
      <FieldArray
        name='localizedAssignments'
        localizedAssignments={localizedAssignments}
        component={LocalizedAssignmentsFormField} />
    </Col>
    <Col lg={6}>
      <FormBox
        title={<FormattedMessage id='app.editExerciseForm.title' defaultMessage='Edit assignment {name}' values={{ name: exercise.name }} />}
        type={hasSucceeded ? 'success' : undefined}
        footer={
          <div className='text-center'>
            <SubmitButton
              invalid={invalid}
              submitting={submitting}
              hasSucceeded={hasSucceeded}
              hasFailed={hasFailed}
              handleSubmit={handleSubmit}
              messages={{
                submit: <FormattedMessage id='app.editExerciseForm.submit' defaultMessage='Edit settings' />,
                submitting: <FormattedMessage id='app.editExerciseForm.submitting' defaultMessage='Saving changes ...' />,
                success: <FormattedMessage id='app.editExerciseForm.success' defaultMessage='Settings were saved.' />
              }} />
          </div>
        }>
        {hasFailed && (
          <Alert bsStyle='danger'>
            <FormattedMessage id='app.editExerciseForm.failed' defaultMessage='Saving failed. Please try again later.' />
          </Alert>)}

        <Field
          name='name'
          component={TextField}
          label={<FormattedMessage id='app.editExerciseForm.name' defaultMessage='Assignment name:' />} />

        <Field
          name='difficulty'
          component={SelectField}
          options={[
            { key: 'easy', name: formatMessage(messages.easy) },
            { key: 'medium', name: formatMessage(messages.medium) },
            { key: 'hard', name: formatMessage(messages.hard) }
          ]}
          label={<FormattedMessage id='app.editExerciseForm.difficulty' defaultMessage='Difficulty' />} />

        <Field
          name='description'
          component={MarkdownTextAreaField}
          label={<FormattedMessage id='app.editExerciseForm.description' defaultMessage='Description for supervisors:' />} />

      </FormBox>
    </Col>
  </Row>
);

EditExerciseForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  values: PropTypes.object,
  handleSubmit: PropTypes.func.isRequired,
  intl: intlShape.isRequired,
  submitting: PropTypes.bool,
  submitFailed: PropTypes.bool,
  submitSucceeded: PropTypes.bool,
  invalid: PropTypes.bool,
  formValues: PropTypes.shape({
    localizedAssignments: PropTypes.array
  })
};

const validate = ({
  name
}) => {
  const errors = {};

  if (!name) {
    errors['name'] = <FormattedMessage id='app.editExerciseForm.validation.emptyName' defaultMessage='Please fill the name of the exercise.' />;
  }

  return errors;
};

export default injectIntl(reduxForm({
  form: 'editExercise',
  validate
})(EditExerciseForm));