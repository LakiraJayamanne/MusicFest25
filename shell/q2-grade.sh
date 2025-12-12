#!/bin/bash
read -p "Enter your score (0-100): " score
# Check if input is a number
if ! [[ "$score" =~ ^[0-9]+$ ]]; then
    echo "Error: Please enter a valid number."
    exit 1
fi

# Check if number is between 0 and 100
if [ "$score" -lt 0 ] || [ "$score" -gt 100 ]; then
    echo "Error: Please enter a valid score between 0 and 100."
    exit 1
fi

# Determine grade
if [ "$score" -ge 70 ]; then
    grade="A"
    message="Excellent! You passed with distinction."
elif [ "$score" -ge 60 ]; then
    grade="B"
    message="Very Good! You passed with merit."
elif [ "$score" -ge 50 ]; then
    grade="C"
    message="Good! You passed."
elif [ "$score" -ge 40 ]; then
    grade="D"
    message="Satisfactory! You passed."
else
    grade="F"
    message="Unfortunately, you did not pass."
fi

echo "Your Score: $score"
echo "Your Grade: $grade"
echo "Message: $message"
