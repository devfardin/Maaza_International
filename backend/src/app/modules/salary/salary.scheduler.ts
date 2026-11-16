import { getSalaryWindow } from './salary.time';
import { SalaryServices } from './salary.services';

const CHECK_EVERY_MS = 60_000;

// Checks once a minute. While the Monday claim window is open, the first check of the week
// sends the "salary is ready" emails; later checks see the weekly record and do nothing.
// Starting the server during the window (or after a restart) still sends the emails.
export const startSalaryScheduler = () => {
    const tick = () => {
        const window = getSalaryWindow();
        if (window.state !== 'open') return;
        SalaryServices.notifyEligibleMembers(window.weekKey)
            .then((sent) => {
                if (sent > 0) console.log(`Salary emails sent for week ${window.weekKey}: ${sent}`);
            })
            .catch((err) => console.error('Salary email run failed', err));
    };

    tick();
    return setInterval(tick, CHECK_EVERY_MS);
};
