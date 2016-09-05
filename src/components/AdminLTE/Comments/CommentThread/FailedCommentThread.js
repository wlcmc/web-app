import React, { PropTypes } from 'react';
import { FormattedMessage } from 'react-intl';

import CommentBox from '../CommentBox';
import AddComment from '../AddComment';
import { FailedIcon } from '../../../Icons';

const LoadingCommentThread = () => (
  <CommentBox
    commentsCount={0}
    footer={<AddComment />}>
    <div>
      <p className='text-center'>
        <FailedIcon /> <FormattedMessage id='app.comments.loadingCommentThread' defaultMessage='The comment thread could not have been loaded.' />
      </p>
    </div>
  </CommentBox>
);

export default LoadingCommentThread;
