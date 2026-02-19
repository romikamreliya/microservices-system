/**
 * Memory Monitoring Utility
 * Tracks and logs memory usage for performance analysis
 */

class MemoryUtils {
    static getMemoryUsage() {
        const used = process.memoryUsage();
        return {
            rss: Math.round(used.rss / 1024 / 1024),              // Resident Set Size
            heapTotal: Math.round(used.heapTotal / 1024 / 1024),
            heapUsed: Math.round(used.heapUsed / 1024 / 1024),
            external: Math.round(used.external / 1024 / 1024)
        };
    }

    static getFormattedMemory() {
        const memory = this.getMemoryUsage();
        return {
            rss: `${memory.rss} MB`,
            heapTotal: `${memory.heapTotal} MB`,
            heapUsed: `${memory.heapUsed} MB`,
            external: `${memory.external} MB`
        };
    }

    static logMemory(label = 'Memory Usage') {
        const memory = this.getFormattedMemory();
        console.log(`\n--- ${label} ---`);
        console.log(`RSS (Total): ${memory.rss}`);
        console.log(`Heap Total: ${memory.heapTotal}`);
        console.log(`Heap Used: ${memory.heapUsed}`);
        console.log(`External: ${memory.external}`);
    }

    static startMonitoring(intervalMs = 10000) {
        setInterval(() => {
            const memory = this.getFormattedMemory();
            console.log(`[Memory Monitor] RSS: ${memory.rss}, Heap: ${memory.heapUsed}/${memory.heapTotal}`);
        }, intervalMs);
    }
}

module.exports = MemoryUtils;
