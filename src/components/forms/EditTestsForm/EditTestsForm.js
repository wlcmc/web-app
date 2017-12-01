import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { reduxForm, FieldArray, Field, getFormValues } from 'redux-form';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Alert } from 'react-bootstrap';

import EditTestsTest from './EditTestsTest';
import { CheckboxField } from '../Fields';
import SubmitButton from '../SubmitButton';

class EditTestsForm extends Component {
  render() {
    const {
      anyTouched,
      submitting,
      handleSubmit,
      hasFailed = false,
      hasSucceeded = false,
      invalid,
      formValues
    } = this.props;

    return (
      <div>
        {hasFailed &&
          <Alert bsStyle="danger">
            <FormattedMessage
              id="app.editTestsForm.failed"
              defaultMessage="Saving failed. Please try again later."
            />
          </Alert>}

        <Field
          name="isUniform"
          component={CheckboxField}
          onOff
          label={
            <FormattedMessage
              id="app.editTestsForm.isUniform"
              defaultMessage="Using uniform point distribution for all tests"
            />
          }
        />

        <FieldArray
          name="tests"
          component={EditTestsTest}
          isUniform={formValues ? formValues.isUniform === true : true}
        />

        <div className="text-center">
          <SubmitButton
            id="editTests"
            invalid={invalid}
            submitting={submitting}
            hasSucceeded={hasSucceeded}
            dirty={anyTouched}
            hasFailed={hasFailed}
            handleSubmit={handleSubmit}
            messages={{
              submit: (
                <FormattedMessage
                  id="app.editTestsForm.submit"
                  defaultMessage="Change configuration"
                />
              ),
              submitting: (
                <FormattedMessage
                  id="app.editTestsForm.submitting"
                  defaultMessage="Saving configuration ..."
                />
              ),
              success: (
                <FormattedMessage
                  id="app.editTestsForm.success"
                  defaultMessage="Configuration was changed."
                />
              )
            }}
          />
        </div>
      </div>
    );
  }
}

EditTestsForm.propTypes = {
  values: PropTypes.array,
  handleSubmit: PropTypes.func.isRequired,
  anyTouched: PropTypes.bool,
  submitting: PropTypes.bool,
  hasFailed: PropTypes.bool,
  hasSucceeded: PropTypes.bool,
  invalid: PropTypes.bool,
  formValues: PropTypes.object
};

const validate = ({ isUniform, tests }) => {
  const errors = {};

  const testsErrors = {};
  const knownTests = new Set();
  for (let i = 0; i < tests.length; ++i) {
    const test = tests[i];
    const testErrors = {};
    if (!test.name || test.name === '') {
      testErrors['name'] = (
        <FormattedMessage
          id="app.editTestsForm.validation.testName"
          defaultMessage="Please fill test name."
        />
      );
    }
    if (knownTests.has(test.name)) {
      testErrors['name'] = (
        <FormattedMessage
          id="app.editTestsForm.validation.testNameTaken"
          defaultMessage="This name is taken, please fill different one."
        />
      );
    }
    knownTests.add(test.name);
    if (!isUniform && (!test.weight || test.weight === '')) {
      testErrors['weight'] = (
        <FormattedMessage
          id="app.editTestsForm.validation.testWeightEmpty"
          defaultMessage="Please fill test weight."
        />
      );
    }
    const weight = Number.parseInt(test.weight);
    if (!isUniform && (!Number.isFinite(weight) || weight < 0)) {
      testErrors['weight'] = (
        <FormattedMessage
          id="app.editTestsForm.validation.testWeight"
          defaultMessage="Test weight must be positive integer."
        />
      );
    }
    testsErrors[i] = testErrors;
  }
  errors['tests'] = testsErrors;

  return errors;
};

export default connect(state => {
  return {
    formValues: getFormValues('editTests')(state)
  };
})(
  reduxForm({
    form: 'editTests',
    validate
  })(EditTestsForm)
);
