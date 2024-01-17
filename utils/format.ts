export const dateFormat = (dateTime: Date) => {
    if(dateTime !== null) {
        const input = new Date(dateTime)
		return input.toLocaleDateString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		})
    }
} 