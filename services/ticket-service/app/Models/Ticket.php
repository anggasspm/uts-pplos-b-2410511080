<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Ticket extends Model
{
    use HasUuids;

    protected $fillable = [
        'ticket_category_id', 'order_id', 'user_id', 'qr_code', 'status', 'used_at',
    ];

    protected $casts = [
        'used_at' => 'datetime',
    ];

    public function ticketCategory()
    {
        return $this->belongsTo(TicketCategory::class);
    }

    public function validations()
    {
        return $this->hasMany(TicketValidation::class);
    }
}