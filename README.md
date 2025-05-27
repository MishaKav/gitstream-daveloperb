export const dryRunActionComment = {
  [GitstreamActions.AddComment]: args => {
    return `add comment \`${parseComment(args.comment, logger)}\``;
  },
  [GitstreamActions.AddLabel]: args => {
    let description = `add label \`${args.label}\``;
    description += args.color ? ` with color \`${args.color}\`` : '';
    return description;
  },
  [GitstreamActions.AddLabels]: args => `add labels \`${args.labels}\``,
  [GitstreamActions.AddReviewers]: args => {
    let addReviewersComment = '';
    if (args.reviewers) {
      addReviewersComment += `add the following reviewers \`${args.reviewers}\``;
    }
    if (args.team_reviewers) {
      addReviewersComment += args.reviewers ? `\n &nbsp; &nbsp; ` : ``;
      addReviewersComment += `add the following team reviewers: \`${args.team_reviewers}\``;
    }
    return addReviewersComment;
  },
  [GitstreamActions.Approve]: () => `approve the PR`,
  [GitstreamActions.CloseV1]: () => `close the PR`,
  [GitstreamActions.MergeV1]: args => {
    let mergeComment = 'merge the PR';
    if (args.rebase_on_merge) {
      mergeComment = `rebase and ${mergeComment}`;
    }
    if (args.squash_on_merge) {
      mergeComment = `squash and ${mergeComment}`;
    }
    return mergeComment;
  },
  [GitstreamActions.SetRequiredApprovals]: args =>
    `require at least \`${args.approvals}\` approvals`,
  [GitstreamActions.RequireReviewersV1]: args =>
    `require approval by either of these reviewers \`${args.reviewers}\``,
  [GitstreamActions.RequestChangesV1]: args =>
    `request change and add this comment: \`${args.comment}\``,
  [GitstreamActions.UpdateCheck]: args =>
    `update the \`${args.checkName}\` check status to \`${args.status}\` with \`${args.conclusion}\` conclusion`,
  [GitstreamActions.AddGithubCheck]: args =>
    `update the \`${args.check_name}\` check status to completed with \`${args.conclusion}\` conclusion`,
  [GitstreamActions.ExplainCodeExpertsV1]: args => {
    let output = 'add explain code experts comment: \n';
    const comment = parseComment(args.comment, logger);
    comment.split('\n').forEach(line => {
      output += `> ${line} \n`;
    });
    return output;
  },
  [GitstreamActions.InvokeGithubActionV1]: args => {
    let inputsString = '';
    Object.keys(args.inputs || []).forEach(
      item => (inputsString += `\`${item}: ${args.inputs[item]}\`\n`)
    );
    const inputs = inputsString ? `\nwith the following inputs: \n${inputsString}` : '';
    return `invoke workflow \`${args.workflow}\` in repo \`${args.owner}/${args.repo}\`, ref: \`${args.ref}\` ${inputs}`;
  },
  [GitstreamActions.RunGithubWorkflowV1]: args => {
    let inputsString = '';
    Object.keys(args.inputs || []).forEach(
      item => (inputsString += `\`${item}: ${args.inputs[item]}\`\n`)
    );
    const inputs = inputsString ? `\nwith the following inputs: \n${inputsString}` : '';
    return `run workflow \`${args.workflow}\` in repo \`${args.owner}/${args.repo}\`, ref: \`${args.ref}\` ${inputs}`;
  },
  [GitstreamActions.UpdateDescriptionV1]: args => {
    const concatenateMode = args.concat_mode
      ? `with concatenate mode: \`${args.concat_mode}\``
      : '';
    return `${concatenateMode} \n${parseComment(args.description, logger)}`;
  },
  [GitstreamActions.CustomActionV1]: args => {
    return `invoke custom action:\n\`${args.plugin}\``;
  },
  [GitstreamActions.CodeReviewV1]: (args: CodeReviewArgs) => {
    const { review } = args || {};
    const shouldApprove = shouldApproveReview(args);
    const prefix = shouldApprove
      ? `add code-review comment and approve PR`
      : 'add code-review comment';
    const finalReview = shouldApprove ? `${review.replace('LGTM', '✅ LGTM')}` : review;

    return `${prefix}:\n${finalReview}`;
  },
  [GitstreamActions.AddCodeCommentV1]: args => {
    const filePath = args.file_path;
    const startLine = args.start_line;
    const endLine = args.end_line ? `-${args.end_line}` : '';
    const comment = args.comment;
    return `File: ${filePath}, Line(s): ${startLine}${endLine}. Comment: ${comment}`;
  },
  [GitstreamActions.DescribeChangesV1]: args => {
    const { concat_mode, description } = args || {};
    const concatenateMode = concat_mode ? `with concatenate mode: \`${concat_mode}\`` : '';

    return `${concatenateMode} \n${description}`;
  },
  default: args => ''
};

