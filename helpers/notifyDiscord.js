const notifyDiscord = async (webhookUrl, message) => {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: message })
        });

        if (!response.ok) {
            throw new Error(`Discord webhook failed with status ${response.status}`);
        }
    } catch (error) {
        console.error('Error notifying Discord:', error);
    }
}

export default notifyDiscord;