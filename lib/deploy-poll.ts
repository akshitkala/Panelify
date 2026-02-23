/**
 * lib/deploy-poll.ts
 */
export async function pollForDeploy(
    siteUrl: string,
    expectedValue: string,
    maxAttempts = 20,
    intervalMs = 3000
): Promise<'live' | 'timeout'> {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const res = await fetch(siteUrl, { cache: 'no-store' });
            const html = await res.text();

            if (html.includes(expectedValue)) {
                return 'live';
            }
        } catch (error) {
            // Ignore fetch errors during rollout
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    return 'timeout';
}
