const LINEAR_API_URL = 'https://api.linear.app/graphql';

export interface LinearClientConfig {
  apiKey: string;
  issuePrefix: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string;
}

export class LinearClient {
  constructor(protected readonly config: LinearClientConfig) {}

  parseIssueKey(text: string): string | null {
    const re = new RegExp(`\\b${this.config.issuePrefix}-\\d+\\b`, 'i');
    const match = text.match(re);
    return match ? match[0].toUpperCase() : null;
  }

  formatIssueKey(number: number): string {
    return `${this.config.issuePrefix}-${number}`;
  }

  async fetchIssue(issueKey: string): Promise<LinearIssue> {
    const data = await this.gql<{
      issues: {
        nodes: Array<{ id: string; identifier: string; title: string; description: string }>;
      };
    }>(
      `query($key: String!) {
        issues(filter: { identifier: { eq: $key } }) {
          nodes { id identifier title description }
        }
      }`,
      { key: issueKey },
    );

    const issue = data.issues.nodes[0];
    if (!issue) {
      throw new Error(`Linear issue "${issueKey}" not found`);
    }

    return issue;
  }

  async addComment(issueId: string, body: string): Promise<void> {
    await this.gql(
      `mutation($issueId: String!, $body: String!) {
        commentCreate(input: { issueId: $issueId, body: $body }) {
          success
        }
      }`,
      { issueId, body },
    );
  }

  private async gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const res = await fetch(LINEAR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: this.config.apiKey },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Linear API error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (json.errors?.length) {
      throw new Error(`Linear GraphQL error: ${json.errors[0]!.message}`);
    }

    return json.data!;
  }
}
