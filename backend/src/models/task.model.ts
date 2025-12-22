import mongoose, { Document, Schema } from 'mongoose';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status = 'To Do' | 'In Progress' | 'Review' | 'Completed';

export interface ITask extends Document {
  title: string;
  description: string;
  dueDate: Date;
  priority: Priority;
  status: Status;
  creatorId: mongoose.Types.ObjectId;
  assignedToId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isOverdue: boolean;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Review', 'Completed'],
      default: 'To Do'
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedToId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate && this.status !== 'Completed';
});

// Indexes
taskSchema.index({ assignedToId: 1, status: 1 });
taskSchema.index({ creatorId: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);