export const updateBulkShipmentStatus = async (shipmentIds: string[], newStatus: string) => {
    try {
        const response = await fetch('http://localhost:8081/api/shipments/update-status',{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shipmentIds: shipmentIds,
                status: newStatus
            })
        });
    return response.ok;
    } catch (error) {
        console.error("I can't find Javy. I'm so sorry  :(", error);
        return false;
    }

};