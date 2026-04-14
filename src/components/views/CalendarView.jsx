import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { useTaskContext } from '../../contexts/TaskContext';
import styles from './CalendarView.module.css';
import Button from '../common/Button';

const CalendarView = () => {
  const { tasks } = useTaskContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const renderHeader = () => {
    return (
      <div className={styles.header}>
        <div className={styles.monthSelector}>
          <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft size={20} /></Button>
          <h2>{format(currentDate, 'MMMM yyyy')}</h2>
          <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight size={20} /></Button>
        </div>
        <Button variant="secondary" onClick={jumpToToday}>Today</Button>
      </div>
    );
  };

  const renderDaysOfWeek = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className={styles.daysRow}>
        {days.map((day, i) => (
          <div className={styles.dayName} key={i}>{day}</div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        
        // Find tasks for this day
        const dayTasks = tasks.filter(t => t.dueDate === format(cloneDay, 'yyyy-MM-dd'));

        days.push(
          <div 
            className={`${styles.cell} ${!isSameMonth(day, monthStart) ? styles.disabled : ''} ${isSameDay(day, new Date()) ? styles.selected : ''}`}
            key={day}
          >
            <span className={styles.number}>{formattedDate}</span>
            <div className={styles.cellTasks}>
              {dayTasks.map(t => (
                <div key={t.id} className={`${styles.miniTask} ${t.status === 'completed' ? styles.miniTaskCompleted : ''}`}>
                  <span className={styles.dot} style={{ backgroundColor: getPriorityColor(t.priority) }}></span>
                  {t.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className={styles.row} key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className={styles.body}>{rows}</div>;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'var(--priority-high)';
      case 'medium': return 'var(--priority-medium)';
      case 'low': return 'var(--priority-low)';
      default: return 'var(--color-primary)';
    }
  };

  return (
    <div className={styles.container}>
      {renderHeader()}
      <div className={styles.calendar}>
        {renderDaysOfWeek()}
        {renderCells()}
      </div>
    </div>
  );
};

export default CalendarView;
